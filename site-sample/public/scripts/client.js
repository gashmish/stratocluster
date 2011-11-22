var map;
var socket;

var server_address = "192.168.1.43:8088";

var markers = [];

function start() {
    Clustering.init();
    initPanel();
    initMap();
    //initConnection();
    loadElena();
}

function loadElena() {
    dima_calls.forEach(function(item) {
        var call = { time: item[1] };
        
        if (item[6] != null) {
            call.lat = item[6][1],
            call.lon = item[6][0]
        };
        
        var position = new google.maps.LatLng(
            call.lat, call.lon);

        addMarker(position, call);
    });
        
    // Сортируем маркеры по времени, чтобы соблюдался порядок
    markers.sort(function(a, b) {
       return a.call.time - b.call.time; 
    });
}

function initPanel() {
    /* 
    $("#start").click(function() {
        var alphas = [ 'a', 'b', 'c' ];
        var num = Math.floor(Math.random()*11 % 6);
        var let = alphas[Math.floor(Math.random()*11 % 3)];
        num = num ? num : 1;

        var img = "1dot" + num + let;

        clusterIcon = "http://www.iconbazaar.com/dots/" + img + ".gif";

        markers.forEach(function(marker) {
            marker.setIcon(clusterIcon);
        });
    });
    */   
}

function initMap() {
    var palaceSquare = new google.maps.LatLng(59.939, 30.315);

    var mapOptions = {
        zoom: 14,
        center: palaceSquare,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        draggableCursor: 'crosshair'
    };

    map = new google.maps.Map(
        document.getElementById("map_canvas"),
        mapOptions);

    google.maps.event.addListener(map, "click", function(event) {
        var call = {
            lat: event.latLng.Pa,
            lon: event.latLng.Qa,
            time: (new Date()).getTime()
        };
        socket.emit('addCall', { call: call });
        addMarker(event.latLng, call);
    });
}

function initConnection() {
    socket = io.connect(server_address);

    socket.on('calls', function (data) {
        data.calls.forEach(function(call) {
            
            var position = new google.maps.LatLng(
                call.lat, call.lon);
            
            addMarker(position, call);
        });
    });

    socket.emit('getCalls');
}

/*
var icon = new google.maps.MarkerImage(
    '/images/1dot1a.gif',
    new google.maps.Size(10, 10),
    null,
    null,
    new google.maps.Size(10, 10));
*/

function addMarker(position, call) {
    //console.log("call placed: " + position);

    var marker = new google.maps.Marker({
        position : position,
        map : map
        //icon : icon
    });

    marker.call = call;

    markers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        socket.emit('removeCall', {
            call : marker.call
        });
        removeMarker(marker);
    });
}

function removeMarker(marker) {
    //console.log("call removed: " + marker.getPosition());

    var index = markers.indexOf(marker);
    markers.splice(index, 1);

    marker.setMap(null);
}

