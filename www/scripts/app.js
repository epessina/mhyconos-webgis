"use strict";

let app;

$(() => app = new App());


class App {

    static get defaultCoords() { return [9.679417, 46.106759] }

    static get defaultZoom() { return 13 }


    constructor() {

        $("#map").height($(window).height());

        this.initUi();

        this._basemaps = [];
        this._overlays = [];

        // this.loadBasemaps();
        //
        // this.initMap();

    }


    initUi() {

        const self = this;

        const $layersPanel = $("#layers-panel");


        const basemaps = {
            default: "images/basemaps/default.png",
            aerial : "images/basemaps/aerial.png",
            labels : "images/basemaps/labels.png",
        };

        $.each(basemaps, (k, v) => new Image().src = v);

        const $baseMapOptions = $(".basemap-option"),
              $baseMapTrigger = $("#basemaps-trigger");

        const closeBaseMaps = () => $baseMapOptions.each(function () {

            $(this).css("right", 16);

            $baseMapTrigger.removeClass("open");

        });

        $baseMapTrigger.click(function () {

            if ($(this).hasClass("open")) closeBaseMaps();

            else {

                $(".basemap-option").each(function (i) { $(this).css("right", 116 + 100 * i) });

                $(this).addClass("open");

            }

        });

        $baseMapOptions.click(function () {

            closeBaseMaps();

            if ($(this).hasClass("basemap-selected")) return;

            $(".basemap-option").each(function () { $(this).removeClass("basemap-selected") });

            $(this).addClass("basemap-selected");

            let bgName = $(this).attr("id").slice(8);

            $baseMapTrigger.css("background-image", () => bgName === "none" ? "none" : `url(${basemaps[bgName]})`);

            for (let i = 0; i < self._basemaps.length; i++) {
                self._basemaps[i].setVisible(self._basemaps[i].get("title") === bgName);
            }

        });


        $("#layers-trigger").click(() => $layersPanel.addClass("open"));

        $("#layers-panel-close").click(() => $layersPanel.removeClass("open"));


        $(".layer").click(function () {

            if ($(this).attr("data-loaded") === "false") {

                console.log(`Loading ${$(this).attr("data-layer")}...`);

                let layer = self.loadWMS(
                    $(this).attr("data-layer"),
                    $(this).attr("data-layer"),
                    2,
                    parseFloat($(this).attr("data-maxres"))
                );

                self._basemaps.push(layer);

                self._map.addLayer(layer);

                $(this).attr("data-loaded", "true");

                $(this).attr("data-visible", "true");

                $(this).find(".layer-visibility i").html("visibility");

                return;

            }


            for (let i = 0; i < self._basemaps.length; i++) {

                if (self._basemaps[i].get("title") === $(this).attr("data-layer")) {

                    self._basemaps[i].setVisible($(this).attr("data-visible") === "false");

                    break;

                }

            }

            $(this).attr("data-visible", ($(this).attr("data-visible") === "false").toString());

            $(this).find(".layer-visibility i").html(() => $(this).attr("data-visible") === "false" ? "visibility_off" : "visibility");

        });


        $(".layer-group-header").click(function () {

            $(this).toggleClass("open");

            let $content = $(this).next(".layer-group-content");

            if ($content.hasClass("open"))
                $content.slideUp();
            else
                $content.slideDown();

            $content.toggleClass("open");

        });

    }


    initMap() {

        let controls = ol.control.defaults().extend([new ol.control.ScaleLine()]);

        this._overlays.push(this.loadWMS("val_tartano", "val_tartano", 1));

        this._map = new ol.Map({
            controls: controls,
            target  : "map",
            layers  : [
                new ol.layer.Group({ title: "basemaps", layers: this._basemaps }),
                new ol.layer.Group({ title: "overlays", layers: this._overlays })
            ],
            view    : new ol.View({ center: ol.proj.fromLonLat(App.defaultCoords), zoom: App.defaultZoom })
        });

    }


    loadBasemaps() {

        this._basemaps.push(
            new ol.layer.Tile({
                title  : "default",
                type   : "base",
                visible: true,
                source : new ol.source.OSM()
            })
        );

        this._basemaps.push(
            new ol.layer.Tile({
                title  : "aerial",
                type   : "base",
                visible: false,
                source : new ol.source.BingMaps({ key: settings.bingKey, imagerySet: 'Aerial' })
            })
        );

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