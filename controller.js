var watchList = [
    "7F8119EE-0E12-4679-9925-667845A5C133",
    "B5D875E8-238C-451F-93B1-DA4C3C57DC9B",
    "F49F0748-5399-4836-BD5A-00C3F2FF4A4B",
    "8518DA1E-72D4-42F8-BAEE-36275FFDE12B"
];

var lwtracker = angular.module('lwtracker', ['ngResource', 'leaflet-directive'])
    .controller('Controller', function($scope, $log, EventDetail, EventStatus) {

        events = {};
        $scope.events = events;

        $scope.colorMe = function(event) {
            if (event["state"] == 'Active') {
                return 'label label-success';
            } else if (event["state"] == 'Warmup') {
                return 'label label-warning';
            } else {
                return 'label label-default';
            }
        };
    })
    .service('EventDetail', function($resource, $log) {
        angular.forEach(watchList, function(id) {
            // add resource for EventDetail API
            var EventDetail = $resource('https://api.guildwars2.com/v1/event_details.json?event_id=:eventID');
            // query EventDetail
            var eventDetail = EventDetail.get({
                eventID: id
            }, function() {
                // run on succesfull EventDetail Call
                // initializes eventList with names, level, status etc
                events[id] = eventDetail["events"][id];
                events[id]["state"] = "";
                events[id]["coords"] = [0, 0];
                // $log.log(events);

                // add resource for MapDetail API
                var MapDetail = $resource('https://api.guildwars2.com/v1/maps.json?map_id=:mapID');
                // query MapDetail
                var mapDetail = MapDetail.get({
                    mapID: events[id]["map_id"]
                }, function() {
                    // run on succesfull MapDetail Call
                    $log.log(mapDetail);
                    events[id]["coords"] = recalc_coords(
                        mapDetail["maps"][events[id]["map_id"]].continent_rect,
                        mapDetail["maps"][events[id]["map_id"]].map_rect,
                        events[id]["location"]["center"]
                    );
                    addMarker(
                        events[id]["coords"][1],
                        events[id]["coords"][0],
                        events[id]["name"]
                    );
                });
            });
        });
    })
    .service('EventStatus', function($resource, $log, $timeout) {
        updateStatus = function() {
            angular.forEach(watchList, function(id) {
                // add resource for EventStatus API
                var EventStatus = $resource('https://api.guildwars2.com/v1/events.json?world_id=2205&event_id=:eventID');
                // query EventStatus
                var eventStatus = EventStatus.get({
                    eventID: id
                }, function() {
                    // run on succesfull EventStatus Call
                    events[id]["state"] = eventStatus["events"][0]["state"];
                    $log.log(events);
                });
            });
            $log.log('--- Timer done');
            $timeout(updateStatus, 5000);
            $log.log("--- Timer started");

        };
        $timeout(updateStatus, 5000);
        $log.log("--- Timer started");

    })
    .controller("Map", function($scope, EventDetail, leafletData) {
        angular.extend($scope, {
            gw2: {
                url: "https://tiles.guildwars2.com/1/1/{z}/{x}/{y}.jpg"
            },
            defaults: {
                tileLayer: "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
                maxZoom: 7,
                minZoom: 2,
                path: {
                    weight: 10,
                    color: '#800000',
                    opacity: 1
                }
            },
            center: {
                lat: 13,
                lng: -58,
                zoom: 5
            }
        });
        $scope.markers = [];
        addMarker = function(lat, lng, message) {
            $scope.markers.push({
                lat: lat,
                lng: lng,
                message: message
            });
        };
    });

function recalc_coords(continent_rect, map_rect, coords) {
    return [
        (continent_rect[0][0] + (continent_rect[1][0] - continent_rect[0][0]) * (coords[0] - map_rect[0][0]) / (map_rect[1][0] - map_rect[0][0])) / 32768 * 360 - 180, (continent_rect[0][1] + (continent_rect[1][1] - continent_rect[0][1]) * (1 - (coords[1] - map_rect[0][1]) / (map_rect[1][1] - map_rect[0][1]))) / -32768 * 360 + 180
    ];
}