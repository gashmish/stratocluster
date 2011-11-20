Clustering = {
    
    init: function () {
        $("#alg1").click(function() {
            var clusters = Clustering.get_time_clusters1(markers);
            Utils.highlight_clusters(clusters);
            console.log("alg1 clusters: " + clusters.length);
            clusters.forEach(function(cluster) {
                console.log(
                    "Time cluster : [" +
                    cluster.length + ": " +
                    new Date(cluster[0].call.time) + "; " +
                    new Date(cluster[cluster.length - 1].call.time) + "]");
            });
        });

        $("#alg2").click(function() {
            var clusters = Clustering.get_hc_clusters(markers);
            Utils.highlight_clusters(clusters);
            console.log("alg2 clusters: " + clusters.length);
        });

    },

    get_time_clusters1: function(markers) {
        //var max_time_delta = 1000 * 60 * 60;
        var max_time_delta = 5000;

        var clusters = [];
        var cluster = [];

        for (var i = 0; i < markers.length - 1; i++) {
            var current = markers[i];
            var next = markers[i + 1];
            
            cluster.push(current);

            if (next.call.time - current.call.time > max_time_delta) {
                clusters.push(cluster);
                cluster = [];
            }
        }
        cluster.push(markers[markers.length - 1]);
        clusters.push(cluster)

        return clusters;
    },

    get_hc_clusters: function(markers) {
        var distance = function(a, b) {
            return Math.sqrt(
                Math.pow(a.call.lat - b.call.lat, 2) +
                Math.pow(a.call.lon - b.call.lon, 2)
            );
        };

        var results = clusterfck.hcluster(
            markers,
            distance,
            clusterfck.COMPLETE_LINKAGE,
            0.03);

        function flatten(leave) {
            if (!leave.left)
                return [ leave.canonical ];
            else
                return flatten(leave.left).concat(flatten(leave.right));
        }

        return results.map(function(root) { return flatten(root) });
    },

    get_hc_clusters2: function(markers) {
        
        var metric = function(a, b) {
            return Math.sqrt(
                Math.pow(a.call.lat - b.call.lat, 2) +
                Math.pow(a.call.lon - b.call.lon, 2)
            );
        };

        var clusters = [];
        var distances = [];

        for (var i = 0; i < markers.length - 1; i++) {
            var distance = {
                metric: metric(markers[i], markers[i + 1]),
                index: i
            }

            var cluster = {
                items: [ marker[i] ],
                index: i,
                distance: distance
            };
            
            distances.push(distance);
            clusters.push(cluster);
        }

        distances.sort(function(a, b) {
            return a.metric - b.metric;
        });

        for
    },

    /* */
    get_inner_clusters: function(set) {
        var clusters = [];

        set.forEach(function(e) { clusters.push(e); });
        
        var matrix = [];

        function distance(a, b) {
            
        }
    }


};


Utils = {
    get_random_dot_image: function() {
        var alphas = [ 'a', 'b', 'c' ];
        var num = Math.floor(Math.random() * 111 % 6);
        var let = alphas[Math.floor(Math.random() * 111 % 3)];
        num = num ? num : 1;

        var img = "1dot" + num + let;
        return "http://www.iconbazaar.com/dots/" + img + ".gif";
    },

    highlight_clusters: function(clusters) {
        clusters.forEach(function(cluster) {
            var icon = Utils.get_random_dot_image();
            
            function highlight_marker(marker) {
                marker.setIcon(new google.maps.MarkerImage(
                    icon,
                    new google.maps.Size(10, 10),
                    null,
                    null,
                    new google.maps.Size(10, 10)
                ));
            }
            
            if ($.isArray(cluster)) {
                cluster.forEach(highlight_marker); 
            } else {
                highlight_marker(cluster); 
            }
        });
    }
};
