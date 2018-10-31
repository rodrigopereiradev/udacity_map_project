const errorGuidelines = [
    'Recarregue a página;',
    'Verifique sua conexão de internet;',
    'Caso as duas últimas orientações não resolvam o problema tente novamente mais tarde, pois um dos serviços externos pode estar indisponível;',
    'Caso o problema persista entre em contato com o suporte do sistema;' 
]

let Place = function(data) {
    this.name = ko.observable(data.name);
    this.description = ko.observable(data.description)
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.wikiArticlesUrls = ko.observableArray(data.wikiArticlesUrls);
}

let ViewModel = function () {

    $('.closed-panel').hide();

    let self = this;
    this.map = {};
    this.hasErrorLoadingPlaces = ko.observable(false);
    this.markers = ko.observableArray([]);
    this.places = ko.observableArray([]);
    this.filteredPlaces = ko.observableArray([]);
    this.errorGuidelines = ko.observableArray(errorGuidelines);
    this.defaultIconMarker = createMarkersIcons('0099FF');
    this.clickedIcon = createMarkersIcons('526C85');
    this.largeInfoWindow = new google.maps.InfoWindow();
    this.bounds = new google.maps.LatLngBounds();
    this.stringFilter = ko.observable('');


    createMap()
    initPlacesAndMarkers();

    /**
     * Esconde o painel com a lista de lugares
     */
    this.hidePlacesList = function() {
        $('.panel').hide();
        $('.closed-panel').show()
    }

    /**
     * Mostra o painel com a lista de lugares
     */
    this.showPlaceList = function() {
        $('.panel').show();
        $('.closed-panel').hide()
    }

    /**
     * Abre uma janela com as informações de um lugar quando ele é clicado na lista de lugares.
     * @param {*} clicledPlace 
     */
    this.openInfoWindow = function(clicledPlace) {
        self.markers().forEach(function(marker) {
            if (marker.title === clicledPlace.name()) {
                marker.setIcon(self.clickedIcon);
                marker.wikiArticlesUrls = clicledPlace.wikiArticlesUrls();
                populateInfoWindow(marker, self.largeInfoWindow);
            }
        });
    }

    /**
     * cria o mapa onde são informadas as coordenadas e o zoom inicial do mapa
     */
    function createMap() {
        self.map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: -15.794062, lng: -47.882757},
            zoom: 13
        });
    }

    /**
     * Faz uma resquisição que retorna uma lista de lugares mockados em uma API externa.
     */
    function initPlacesAndMarkers() {
        let mockPlacesUrl = 'http://weathered-feather-7676.getsandbox.com/places';
            $.ajax({
                url: mockPlacesUrl,
                async: false,
                dataType: 'json',
                success: function(response) {
                    // Em caso de sucesso na requisição a lista de lugares, macadores 
                    //e lugares filtrados são alimentadas.
                    self.places = ko.computed(addItensToPlacesList(response));
                    getWikiArticlesUrls();
                    self.markers = ko.computed(createAndAddMarkersToList());
                    addItensToFilteredPlaces();
                },
                error: function(error) {
                    //Em caso de erro o container com orientações é mostrado na tela 
                    //e o containder com a lista é escondido.
                    self.hasErrorLoadingPlaces = ko.observable(true);
                }
            });
    }

    /**
     * Adiciona os lugares retornados na reuisição ao SandBox à lista de lugares.
     * É criada uma instancia de Place para cada lugar retornados. 
     * @param {*} placesRequested 
     */
    function addItensToPlacesList(placesRequested) {
        let places = ko.observableArray([]);
        placesRequested.map(function(place) {
            places().push(new Place(place));
        })
        return places;
    }

    /**
     * Cria e adiciona marcadores à lista de marcadores 
     */
    function createAndAddMarkersToList() {
        self.places().forEach(function(place) {
            let index = self.places().indexOf(place);
            let timeout = index * 200;
            let marker = {};
            window.setTimeout(function() {
                marker = createMarker(place);
                self.markers().push(marker);
                marker.addListener('click', function() {
                this.setIcon(self.clickedIcon)
                this.wikiArticlesUrls = place.wikiArticlesUrls();
                populateInfoWindow(this, self.largeInfoWindow);
            });
            }, timeout);
        });
        return self.markers;
    }

    /**
     * Adiciona places à lista de lugares filtrados.
     */
    function addItensToFilteredPlaces() {
        self.filteredPlaces = ko.computed(function() {
            let filteredPlaces = ko.observableArray([]);
            filteredPlaces = filterPlacesList(filteredPlaces);
            filterMarkers();
            return filteredPlaces();
        })
    }

    // lida com a atualizaçao dos elementos da lista de lugares filtrados.
    ko.bindingHandlers.scrollPlaces = {
        update: function(elementm, valueAccessor) {
            let perfectScrollbar = new PerfectScrollbar('#filtered-list');
            perfectScrollbar.update();
        }
    }

    /**
     * Faz a filtragem dos lugares de acordo com o que digitado no input.
     * @param {*} filteredPlaces 
     */
    function filterPlacesList(filteredPlaces) {
        self.places().map(function(place){
            if (place.name().toLowerCase().includes(self.stringFilter().toLowerCase()))
            filteredPlaces().push(place);
        });
        return filteredPlaces;
    }

    /**
     * Faz a filtragem dos marcadores de acordo com o que digitado no input. Caso o resoltado
     * da validação seja verdadeiro, o marcador é mostrado na tela.
     */
    function filterMarkers() {
        self.markers().map(function(marker){
            if (marker.title.toLowerCase().includes(self.stringFilter().toLowerCase())) {
                showMarker(marker);
            } else {
                marker.setMap(null);
            }
        });
    }

    /**
     *  Mostra o marcador na tela conforme solicitado.
     * @param {*} marker 
     */
    function showMarker(marker) {
        marker.setMap(self.map);
        self.bounds.extend(marker.position)
        self.map.fitBounds(self.bounds);
    }

    /**
     * Essa função cria ícones para os marcadores com a cor passada através do parâmetro.
     * @param {*} markerIconColor 
     */
    function createMarkersIcons(markerIconColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerIconColor +
          '|40|_|%E2%80%A2',
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34),
          new google.maps.Size(21,34));
        return markerImage;
    }

    /**
     * Faz requisição que traz uma lista de artigos relacionados com o nome do lugar
     */
    function getWikiArticlesUrls() {
        self.places().forEach(function(place) {
            let wikipediaUrl = 'https://www.wikipedia.org/w/api.php?action=opensearch&search=' +
            place.name() + '&format=json&callback=wikiCallback';
            $.ajax({
                url: wikipediaUrl,
                dataType: 'jsonp',
                success: function(response) {
                    place.wikiArticlesUrls = ko.observableArray(response);
                },
                error: function(error) {
                    place.wikiArticlesUrls = ko.observable(error);
                }
            });
        });
    }

    /**
     * Essa funcão cria um marcador para cada lugar
     * @param {*} place 
     */
    function createMarker(place) {
        let position = {lat: place.lat(), lng: place.lng()};
        let title = place.name();
        let index = self.places().indexOf(place);
        return new google.maps.Marker({
            map: self.map,
            position: position,
            title: title,
            description: place.description(),
            wikiArticlesUrls: place.wikiArticlesUrls(),
            animation: google.maps.Animation.DROP,
            icon: self.defaultIconMarker,
            id: index
        });
    }

    /**
     * Essa função popula a janela quando o marcador é clicado. Será permitido apenas uma janela 
     * aberta de acordo com o clique, que será populada de acordo com a sua posição no mapa.
     * @param {*} marker 
     * @param {*} infoWindow 
     * @param {*} place
     */
    function populateInfoWindow(marker, infoWindow) {
        let streetViewService = new google.maps.StreetViewService();
        const radius = 50;
        if (infoWindow.marker != marker) {
            infoWindow.marker = marker;
            infoWindow.setContent('');
            infoWindow.addListener('closeclick', function() {
                marker.setAnimation(google.maps.Animation.DROP)
                infoWindow.setMarker = null;
                marker.setIcon(self.defaultIconMarker);
            });
        }
        function getStreetView(data, status) {
            let nearStreetViewPlace = data.location.latLng;
            let heading = google.maps.geometry.spherical.computeHeading(nearStreetViewPlace, marker.position);
            infoWindow.setContent(createContentToInfoWindow(marker, status));
            let panoramaOptions = {
                position: nearStreetViewPlace,
                pov: {
                    heading: heading,
                    pitch: 30
                }
            }
            let panorama = new google.maps.StreetViewPanorama(document.getElementById('street-view'), panoramaOptions);
        };
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        marker.setAnimation(google.maps.Animation.BOUNCE)
        infoWindow.open(this.map, marker)
    }

    /**
     * Essa função cria os elementos html inseridos na janela de cada marcador
     * @param {*} place 
     */
    function createContentToInfoWindow(marker, status) {
        let articlesListElemnts = getArticlesElements(marker.wikiArticlesUrls);
        let streetViewElement = getStreetViewElement(status);
        return '<div class="info-window" ><h3>'+ marker.title + '</h3><p>' + marker.description + '</p>' +
        '<h4>Google Street View</h4>'+ streetViewElement +
        '<h4>Artigos na Wikipedia Relacionados</h4><ul>'+ articlesListElemnts + '</ul></div>';
    }

    /**
     * Cria um elemento para cada artigo encontrado com o nome do lugar clicado e retorna uma string 
     * @param {*} wikipediaArticles 
     */
    function getArticlesElements(wikipediaArticles) {
        let listElements = '';
        if (!wikipediaArticles)
            return '';
        if (wikipediaArticles.status) 
            return '<i class="error-msg fa fa-exclamation-triangle"></i><span class="error-msg"> Ocorreu um erro ao requisitar os artigos da Wikipedia</span>';
        if (wikipediaArticles.length === 0 || wikipediaArticles[1].length === 0)
            return '<span>Não há artigos relacionados...</span>';
        wikipediaArticles[1].forEach(function(articleTitle){
            let url = 'http://www.wikipedia.org/wiki/' + articleTitle;
            let li = '<li><a href="' + url + '" target="_blank">'+ articleTitle +'</a></li>';
            listElements = listElements + li
        })
        return listElements;
    }

    /**
     * Essa função retorna um div caso haja um Street View para o local ou
     *  uma mensagem infomando que não há uma street view
     * @param {*} status 
     */
    function getStreetViewElement(status) {
        if (status === 'OK')
            return '<div id="street-view"></div>';
        return '<span>Street View não encontrado</span>';
    }

};

function initMap() {
    ko.applyBindings(new ViewModel());
}