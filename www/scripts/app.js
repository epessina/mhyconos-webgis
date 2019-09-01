"use strict";

$(() => {

    $("#map").height($(window).height());

    let map = L.map("map", {
        zoomSnap              : 0,       // the zoom level will not be snapped after a pinch-zoom
        zoomAnimation         : true,    // enable zoom animation
        zoomAnimationThreshold: 4,       // don't animate the zoom if the difference exceeds 4
        fadeAnimation         : true,    // enable tile fade animation
        markerZoomAnimation   : true,    // markers animate their zoom with the zoom animation
        touchZoom             : "center" // pinch-zoom will zoom to the center of the view
    });

    // Add a basemap from OpenStreetMap to the map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { errorTileUrl: "img/errorTile.png" })
        .addTo(map);

    map.setView([45.464161, 9.190336], 11);

});