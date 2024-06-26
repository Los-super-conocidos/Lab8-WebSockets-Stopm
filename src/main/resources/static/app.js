var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    class Polygon {
        constructor(points) {
            this.points = points;
        }
    }

    var stompClient = null;

    var pointsList =  [];

    var pointsNumber = 0;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2;
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var addPolygonToCanvas = function (polygon) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.strokeStyle = "cyan";
        ctx.moveTo(polygon[0].x, polygon[0].y);
        for (var i = 1; i < polygon.length; i++) {
            ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
    };


    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            var topicId = document.getElementById("roomId").value;
            stompClient.subscribe('/topic/newpoint.'+ topicId, function (eventbody) {
                var theObject=JSON.parse(eventbody.body);
                var x = theObject.x;
                var y = theObject.y;
                //alert("Coordenadas del punto: "  + x + ", " + y);
                addPointToCanvas(new Point(x, y));
            });
            stompClient.subscribe('/topic/newpolygon.' + topicId, function (eventbody) {
                var newPolygon = JSON.parse(eventbody.body);
                addPolygonToCanvas(newPolygon);
            });
        });

    };



    return {

        init: function () {

            //websocket connection
            connectAndSubscribe();
        },

        publishPoint: function (px, py) {
            var pt = new Point(px, py);
            var topicId = document.getElementById("roomId").value;
            if(topicId != null){
                stompClient.send("/app/newpoint." + topicId, {}, JSON.stringify(pt));
                addPointToCanvas(pt);
            }else{
                alert("Ingrese el id de la sala a donde desea dibujar");
            }
                
        },

        getMousePosition: function (event){
            var canvas = document.getElementById("canvas");
            var rect = canvas.getBoundingClientRect();
            this.publishPoint(event.clientX - rect.left, event.clientY - rect.top);  
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();