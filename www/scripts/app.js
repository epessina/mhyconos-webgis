"use strict";

let app;

$(() => app = new App());


class App {

    static get defaultCoords() { return [9.679417, 46.106759] }

    static get defaultZoom() { return 13 }


    constructor() {

        $("#map").height($(window).height());

        this.initUi();

        this._layers = [];

        this.loadBasemaps();

        this.initMap();

    }


    initUi() {

        const self = this;

        const $layersPanel = $("#layers-panel");


        $("#basemaps-trigger").click(() => $("#basemaps-menu").toggleClass("open"));

        $("input[name='basemaps']").on("change", function () {

            for (let i = 0; i < self._layers.length; i++) {

                self._layers[i].setVisible(self._layers[i].get("title") === $(this).val());

            }

        });


        $("#layers-trigger").click(() => $layersPanel.addClass("open"));

        $("#layers-panel-close").click(() => $layersPanel.removeClass("open"));

        $(".layer").click(function () {

            if ($(this).attr("data-loaded") === "false") {

                console.log(`Loading ${$(this).attr("data-layer")}...`);

                let layer = self.loadWMS($(this).attr("data-layer"), $(this).attr("data-layer"));

                self._layers.push(layer);

                self._map.addLayer(layer);

                $(this).attr("data-loaded", "true");

                $(this).attr("data-visible", "true");

                $(this).find("i").html("visibility");

                return;

            }


            for (let i = 0; i < self._layers.length; i++) {

                if (self._layers[i].get("title") === $(this).attr("data-layer")) {

                    self._layers[i].setVisible($(this).attr("data-visible") === "false");

                    break;

                }

            }

            $(this).attr("data-visible", ($(this).attr("data-visible") === "false").toString());

            $(this).find("i").html(() => $(this).attr("data-visible") === "false" ? "visibility_off" : "visibility");

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

        let mousePositionControl = new ol.control.MousePosition({
            coordinateFormat: ol.coordinate.createStringXY(4),
            projection      : "EPSG:4326",
            className       : "custom-mouse-position",
            target          : document.getElementById("mouse-position"),
            undefinedHTML   : '&nbsp;'
        });

        let scaleBarControl = new ol.control.ScaleLine({ target: document.getElementById("scale-bar") });


        let controls = ol.control.defaults().extend([
            mousePositionControl,
            new ol.control.ScaleLine()
        ]);

        this._layers.push(this.loadWMS("val_tartano", "val_tartano", 1));

        this._map = new ol.Map({
            controls: controls,
            target  : "map",
            layers  : this._layers,
            view    : new ol.View({ center: ol.proj.fromLonLat(App.defaultCoords), zoom: App.defaultZoom })
        });

    }


    loadBasemaps() {

        this._layers.push(
            new ol.layer.Tile({
                title  : "osm",
                type   : "base",
                visible: true,
                source : new ol.source.OSM()
            })
        );

        this._layers.push(
            new ol.layer.Tile({
                title  : "aerial",
                type   : "base",
                visible: false,
                source : new ol.source.BingMaps({ key: settings.bingKey, imagerySet: 'Aerial' })
            })
        );

        this._layers.push(
            new ol.layer.Tile({
                title  : "aerialLabel",
                type   : "base",
                visible: false,
                source : new ol.source.BingMaps({ key: settings.bingKey, imagerySet: "AerialWithLabels" })
            })
        );

    }


    loadWMS(title, layer, zIndex = 0, opacity = 1, visible = true, minRes, maxRes) {

        const source = new ol.source.ImageWMS({
            url        : settings.wmsUrl,
            params     : { "LAYERS": `mhyconos:${layer}` },
            serverType : "geoserver",
            crossOrigin: "Anonymous"
        });

        const l = new ol.layer.Image({
            title        : title,
            source       : source,
            opacity      : opacity,
            minResolution: minRes,
            maxResolution: maxRes,
            visible      : visible
        });

        l.setZIndex(zIndex);

        return l;

    }

}