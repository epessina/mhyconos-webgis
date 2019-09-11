"use strict";

let app;

$(() => app = new App());


class App {

    /** The default coordinates of the center of the map. */
    static get defaultCoords() { return [9.679417, 46.106759] }

    /** The default zoom of the map. */
    static get defaultZoom() { return 13 }


    /**
     * Initializes the map and the UI.
     *
     * @constructor
     */
    constructor() {

        // Set the height of the map to match the one of the screen
        $("#map").height($(window).height());

        // Initialize the user interface
        this.initUi();

        // Initialize the layer containers
        this._basemaps = [];
        this._overlays = [];

        // // Load the basemaps
        // this.loadBasemaps();
        //
        // // Initialize the map
        // this.initMap();

    }


    /** Initializes all user interface elements. */
    initUi() {

        // Save the reference to the class
        const self = this;


        // Save the urls of each basemap thumbnail
        const basemaps = {
            default: "images/basemaps/default.png",
            aerial : "images/basemaps/aerial.png",
            labels : "images/basemaps/labels.png",
        };

        // Cache the basemaps thumbnails
        $.each(basemaps, (k, v) => new Image().src = v);

        // Cache the DOM elements
        const $baseMapOptions = $(".basemap-option"),
              $baseMapTrigger = $("#basemaps-trigger");

        // Utility function to close the basemaps selector
        const closeBaseMaps = () => {

            // For each basemaps possibility
            $baseMapOptions.each(function () {

                // Hide the thumbnail
                $(this).css("right", 16);

                // Close the menu
                $baseMapTrigger.removeClass("open");

            });

        };

        // Fired when the user clicks on the basemap trigger
        $baseMapTrigger.click(function () {

            // If the basemaps menu is open, close it
            if ($(this).hasClass("open")) closeBaseMaps();

            // Else
            else {

                // Show the thumbnails
                $(".basemap-option").each(function (i) { $(this).css("right", 116 + 100 * i) });

                // Open the menu
                $(this).addClass("open");

            }

        });

        // Fired when the user clicks on a basemap thumbnail
        $baseMapOptions.click(function () {

            // Close the menu
            closeBaseMaps();

            // If the basemap selected is already active, return
            if ($(this).hasClass("basemap-selected")) return;

            // Remove the selection from all the basemaps
            $(".basemap-option").each(function () { $(this).removeClass("basemap-selected") });

            // Select the selected basemaps
            $(this).addClass("basemap-selected");

            // Save the name of the selected basemap
            let bgName = $(this).attr("id").slice(8);

            // Set the background of the trigger
            $baseMapTrigger.css("background-image", () => bgName === "none" ? "none" : `url(${basemaps[bgName]})`);

            // For each beasemap layer
            for (let i = 0; i < self._basemaps.length; i++) {

                // Hide or show it accordingly to the selection
                self._basemaps[i].setVisible(self._basemaps[i].get("title") === bgName);

            }

        });


        // Cache the layers panel
        const $layersPanel = $("#layers-panel");

        // When the user clicks on the trigger, open the layers panel
        $("#layers-panel-trigger").click(() => $layersPanel.addClass("open"));

        // When the user clicks on the close button, close the layers panel
        $("#layers-panel-close").click(() => $layersPanel.removeClass("open"));


        // Save the number of layers
        const layerNumber = $(".layer").length;

        // Fired when the user clicks on the "eye" icon of a layer
        $(".layer-visibility").click(function () {

            // Save the layer object
            const $layer = $(this).parent();

            // If the data aren't loaded yet
            if ($layer.attr("data-loaded") === "false") {

                console.log(`Loading ${$layer.attr("data-layer")}...`);

                // Calculate the z-index of the layer
                const idx = layerNumber - $(".layer").index($layer);

                // Load the layer
                const layer = self.loadWMS(
                    $layer.attr("data-layer"),
                    $layer.attr("data-layer"),
                    idx,
                    parseFloat($layer.attr("data-maxres"))
                );

                // Push the layer in the overlays array
                self._overlays.push(layer);

                // Add the layer to the map
                self._map.addLayer(layer);

                // Set the data as loaded
                $layer.attr("data-loaded", "true");

                // Set the data as visible
                $(this).attr("data-visible", "true");

                // Change the visibility icon
                $(this).find("i").html("visibility");

                // Return
                return;

            }

            // For each loaded layer
            for (let i = 0; i < self._overlays.length; i++) {

                // If the layer is the selected one
                if (self._overlays[i].get("title") === $layer.attr("data-layer")) {

                    // Set the visibility of the layer
                    self._overlays[i].setVisible($(this).attr("data-visible") === "false");

                    // Break the loop
                    break;

                }

            }

            // Change the visibility attribute
            $(this).attr("data-visible", ($(this).attr("data-visible") === "false").toString());

            // Change the visibility icon
            $(this).find("i").html("visibility").html(() => $(this).attr("data-visible") === "false" ? "visibility_off" : "visibility");

        });

        // Fired when the user clicks on the header of a layer group
        $(".layer-group-header").click(function () {

            // Open or close the group
            $(this).toggleClass("open");

            // Save the content of the group
            let $content = $(this).next(".layer-group-content");

            // Slide the contend up or down
            if ($content.hasClass("open"))
                $content.slideUp();
            else
                $content.slideDown();

            // Open or close the content
            $content.toggleClass("open");

        });

    }


    /** Initializes the map. */
    initMap() {

        // Create a new scale bar
        let controls = ol.control.defaults().extend([new ol.control.ScaleLine()]);

        // Create a new map
        this._map = new ol.Map({
            controls: controls,
            target  : "map",
            layers  : [
                new ol.layer.Group({ title: "basemaps", layers: this._basemaps }),
                new ol.layer.Group({ title: "overlays", layers: this._overlays })
            ],
            view    : new ol.View({ center: ol.proj.fromLonLat(App.defaultCoords), zoom: App.defaultZoom })
        });

        // Load the boundaries of the Tartano basin
        $("#tartano-visibility").trigger("click");

    }


    /** Loads the basemaps. */
    loadBasemaps() {

        // Load the OSM basemap
        this._basemaps.push(new ol.layer.Tile({
            title  : "default",
            type   : "base",
            visible: true,
            source : new ol.source.OSM()
        }));

        // Load the Bing aerial basemap
        this._basemaps.push(
            new ol.layer.Tile({
                title  : "aerial",
                type   : "base",
                visible: false,
                source : new ol.source.BingMaps({ key: settings.bingKey, imagerySet: 'Aerial' })
            })
        );

        // Load the Bing aerial with labels basemap
        this._basemaps.push(
            new ol.layer.Tile({
                title  : "labels",
                type   : "base",
                visible: false,
                source : new ol.source.BingMaps({ key: settings.bingKey, imagerySet: "AerialWithLabels" })
            })
        );

    }


    /**
     * Loads an image through a WMS request to GeoServer.
     *
     * @param {String} title - The title to assign to the image.
     * @param {String} layerName - The name of the layer to load.
     * @param {Number} [zIndex=0] - The z-index value to assign to the layer.
     * @param {number} [maxRes] - The maximum resolution (exclusive) below which this layer will be visible.
     * @returns {ol.layer.Image} The rendered image.
     */
    loadWMS(title, layerName, zIndex = 0, maxRes) {

        // Configure the WMS request
        const source = new ol.source.ImageWMS({
            url        : settings.wmsUrl,
            params     : { "LAYERS": `mhyconos:${layerName}` },
            serverType : "geoserver",
            crossOrigin: "Anonymous"
        });

        // Create the image
        const layer = new ol.layer.Image({
            title        : title,
            source       : source,
            opacity      : 1,
            minResolution: 0,
            maxResolution: maxRes,
            visible      : true
        });

        // Set the z-index to the image
        layer.setZIndex(zIndex);

        // Return the image
        return layer;

    }


    getZoomLevel() { return Math.log2(156543.03390625) - Math.log2(this._map.getView().getResolution()) }

}