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
            var clusters = Clustering.get_hc_clusters2(markers);
            
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
        var distanse = function(a, b) {
            return Math.sqrt(
                Math.pow(a.call.lat - b.call.lat, 2) +
                Math.pow(a.call.lon - b.call.lon, 2)
            );
        };

        var results = clusterfck.hcluster(
            markers,
            distanse,
            clusterfck.COMPLETE_LINKAGE,
            0.01);

        function flatten(leave) {
            if (!leave.left)
                return [ leave.canonical ];
            else
                return flatten(leave.left).concat(flatten(leave.right));
        }

        return results.map(function(root) { return flatten(root) });
    },

    get_hc_clusters2: function(markers) {
        var MAX_DISTANSE = 0.01;

        markers.sort(function(a, b) {
           return a.call.time - b.call.time; 
        });
        
        var metric = function(a, b) {
            return Math.sqrt(
                Math.pow(a.call.lat - b.call.lat, 2) +
                Math.pow(a.call.lon - b.call.lon, 2)
            );
        };
      
        /* clusters array sorted by distanse (descending) */
        var sorted = [];

        /* fill linked-list and sorted array */
        
        var prev = {};
        var head = prev;

        for (var i = 0; i < markers.length - 1; i++) {
          
            prev.next = { 
                items:     [ markers[i] ],
                distanse:  metric(markers[i], markers[i + 1]),
                prev:      prev,
                num:       i
            };

            sorted.push(prev.next);
            prev = prev.next;
        }

        prev.next = {
            items:     [ markers[markers.length - 1] ],
            prev: prev,
            num: markers.length - 1
        };

        // unlink list from head 
        delete head.next.prev; 
        

        while (true) {
            // select cluster with shortest distanse
            sorted.sort(function(a, b) {
                return a.distanse - b.distanse;
            });
            
            var cluster = sorted[0];

            if (cluster == undefined || cluster.distanse > MAX_DISTANSE) {
                break;
            }
            
            // get neighbour clusters 
            var left_cluster = cluster.prev; 
            var merged_cluster = cluster.next;
            var right_cluster = merged_cluster.next;
            
            if (left_cluster !== undefined) {
                var left_distanse = metric(
                    left_cluster.items[0],
                    merged_cluster.items[merged_cluster.items.length - 1]);

                left_cluster.distanse = left_distanse;
            } 

            if (right_cluster !== undefined) {
                 
                var right_distanse = metric(
                    cluster.items[0],
                    right_cluster.items[right_cluster.items.length - 1]);

                //update
                cluster.distanse = right_distanse;
                cluster.next = right_cluster;
                right_cluster.prev = cluster;
                
                //remove merged_cluster from sorted
                sorted.splice(sorted.indexOf(merged_cluster), 1);
            } else {
                delete cluster.distanse;
                delete cluster.next;
                //remove cluster from sorted
                sorted.splice(sorted.indexOf(cluster), 1);
            }


            // merge items 
            cluster.items = cluster.items.concat(merged_cluster.items);
        }

        var result = [];
        head = head.next;
        do {
            result.push(head.items);
            head = head.next;
        } while (head !== undefined);

        console.log(result);
        
        return result;
    },

    /* */
    get_inner_clusters: function(set) {
        var clusters = [];

        set.forEach(function(e) { clusters.push(e); });
        
        var matrix = [];

        function distanse(a, b) {
            
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
