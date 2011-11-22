
var MAX_TIME_DELTA = 1000 * 60 * 60;
var MAX_DISTANSE1 = 0.02; 
var MAX_DISTANSE2 = 0.02;

/* Мектрика расстояния между двумя маркерами */
var metric = function(a, b) {
    return Math.sqrt(
        Math.pow(a.call.lat - b.call.lat, 2) +
        Math.pow(a.call.lon - b.call.lon, 2)
    );
};

/* Центр кластера */
var cluster_centroid = function(cluster) {
    var centroid = {
        call: { lon: 0, lat: 0 }
    };
    cluster.items.forEach(function(i) {
        centroid.call.lon += i.call.lon;
        centroid.call.lat += i.call.lat;
    });
    centroid.call.lon /= cluster.items.length;
    centroid.call.lat /= cluster.items.length;
    return centroid;
}

/* Расстояние между двумя максимально удаленными
 * по времени точками входных кластеров
 */
var cluster_time_distanse = function(a, b) {
    return metric(a.items[0], b.items[b.items.length - 1]);
}

/* Расстояние между центрами двух кластеров */         
var cluster_average_distanse = function(a, b) {
    return metric(cluster_centroid(a), cluster_centroid(b));
}


Clustering = {
    
    init: function () {
        $("#time").click(function() {
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

        $("#sub").click(function() {

            var time_clusters = Clustering.get_time_clusters1(markers);
            console.log(time_clusters);
           
            var sub_clusters = [];
            time_clusters.forEach(function(time_cluster) {
//                console.log(time_cluster.length);
                var res = Clustering.get_sub_clusters(time_cluster);
                console.log(res);
                sub_clusters = sub_clusters.concat(res); 
            });

            console.log(sub_clusters); 
            Utils.highlight_clusters(sub_clusters);
        });
        
        $("#big").click(function() {

            var time_clusters = Clustering.get_time_clusters1(markers);
            console.log(time_clusters);
           
            var sub_clusters = [];
            time_clusters.forEach(function(time_cluster) {
                var res = Clustering.get_sub_clusters(time_cluster);
                sub_clusters = sub_clusters.concat(res); 
            });
            console.log(sub_clusters); 

            //var sub_clusters = Clustering.get_sub_clusters(markers);
            //console.log(sub_clusters); 
            //Utils.highlight_clusters(sub_clusters);

            var clusters = Clustering.get_global_clusters(sub_clusters); 
            Utils.highlight_clusters(clusters);
            console.log(clusters); 
            console.log("alg2 clusters: " + clusters.length);
        });

    },

    get_time_clusters1: function(markers) {
        var clusters = [];
        var cluster = [];

        for (var i = 0; i < markers.length - 1; i++) {
            var current = markers[i];
            var next = markers[i + 1];
            
            cluster.push(current);

            if (next.call.time - current.call.time > MAX_TIME_DELTA) {
                clusters.push(cluster);
                cluster = [];
            }
        }
        cluster.push(markers[markers.length - 1]);
        clusters.push(cluster)

        return clusters;
    },


    get_sub_clusters: function(markers) {
        
        /*
         * Подготовка данных
         */

        // Кластеры, упорядоченые по удаленности от последующего кластера-соседа 
        var sorted = [];

        // Заполняем последовательный связный список кластеров 'head' и массив 'sorted' 
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
        delete head.next.prev; 


        /*
         * Алгоритм
         */

        var cluster_distanse = cluster_average_distanse;
        
        while (true) {
            // select cluster with shortest distanse
            sorted.sort(function(a, b) {
                return a.distanse - b.distanse;
            });
            var cluster = sorted[0];
            if (cluster == undefined || cluster.distanse > MAX_DISTANSE1) {
                break;
            }
            
            // get neighbour clusters 
            var left_cluster = cluster.prev; 
            var merged_cluster = cluster.next;
            var right_cluster = merged_cluster.next;
            
            if (left_cluster !== undefined) {
                var left_distanse =
                    cluster_distanse(left_cluster, merged_cluster);
                
                //var left_distanse = metric(
                //    left_cluster.items[0],
                //    merged_cluster.items[merged_cluster.items.length - 1]);
                
                left_cluster.distanse = left_distanse;
            } 

            if (right_cluster !== undefined) {
                var right_distanse =
                    cluster_distanse(cluster, right_cluster);

                //var right_distanse = metric(
                //    cluster.items[0],
                //    right_cluster.items[right_cluster.items.length - 1]);

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

        // Подготавливаем результат
        var result = [];
        head = head.next;
        do {
            result.push(head.items);
            head = head.next;
        } while (head !== undefined);

        return result;
    },
    
    get_global_clusters: function(sub_clusters) {
        
        var clusters = [];
        sub_clusters.forEach(function(cluster) {
           clusters.push( { items: cluster } );
        });

        var tree = clusterfck.hcluster(
            clusters,
            cluster_average_distanse, 
            clusterfck.COMPLETE_LINKAGE,
            MAX_DISTANSE2);

        function flatten(leave) {
            if (!leave.left)
                return [ leave.canonical ];
            else
                return flatten(leave.left).concat(flatten(leave.right));
        }

        var big_clusters = tree.map(function(root) { return flatten(root) });
            
        var results = [];        
        big_clusters.forEach(function(big) {
            var cluster = [];
            big.forEach(function(c) {
                cluster = cluster.concat(c.items);
            });
            results.push(cluster);
        }); 
        return results;
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
