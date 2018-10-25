
let mockPlaces = [
    {
        name: 'Congresso Nacional',
        description: 'Sede do poder legislativo da Republica Federativa do Brasil',
        lat: -15.7997119,
        lng: -47.8641629,
        wikiArticlesUrls: []
    },
    {
        name: 'Torre de TV',
        description: 'Torre de transmissão de TV analógica inaugurada em 1967',
        lat: -15.789632,
        lng: -47.894358,
        wikiArticlesUrls: []
    },
    {
        name: 'Estádio Nacional Mané Garrincha',
        description: 'Estádio construído voltado para jogos da Copa do Mundo de 2014',
        lat: -15.7835191,
        lng: -47.899211,
        wikiArticlesUrls: []
    },
    {
        name: 'Palácio do Planalto',
        description: 'Sede do poder executivo da Republica Federativa do Brasil',
        lat: -15.7990489,
        lng: -47.8607689,
        wikiArticlesUrls: []
    },
    {
        name: 'Supremo Tribunal Federal',
        description: 'Sede do poder judiciário da Republica Federativa do Brasil',
        lat: -15.8021689,
        lng: -47.8618524,
        wikiArticlesUrls: []
    }
]

let Place = function(data) {
    this.name = ko.observable(data.name);
    this.description = ko.observable(data.description)
    this.lat = ko.observable(data.lat);
    this.lng = ko.observable(data.lng);
    this.wikiArticlesUrls = ko.observableArray(data.wikiArticlesUrls);
}

let ViewModel = function () {

    let self = this;
    this.markers = [];
    this.wikipediaArticles = []
    
    //cria o mapa onde são informadas as coordenadas e o zoom inicial do mapa
    this.map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -15.7801, lng: -47.9292},
        zoom: 15
    });

    this.places = ko.observableArray([]);

    mockPlaces.forEach(function(place) {
        self.places.push(new Place(place));
    });

    getWikiArticlesUrls();
    this.largeInfoWindow = new google.maps.InfoWindow();
    this.bounds = new google.maps.LatLngBounds();

    //percorre a lista de lugares e cria um marcador para cada um
    this.places().forEach(function(place) {
        let position = {lat: place.lat(), lng: place.lng()};
        let title = place.name();
        let index = self.places().indexOf(place);
        let marker = new google.maps.Marker({
            map: self.map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: index
        });
        self.markers.push(marker);
        marker.addListener('click', function() {
            populateInfoWindow(this, self.largeInfoWindow, place);
        });
        self.bounds.extend(self.markers[index].position)
    });

    this.map.fitBounds(this.bounds);

    /**
     * Faz requisição que traz uma lista de artigos relacionados com o nome do lugar
     */
    function getWikiArticlesUrls() {
        self.places().forEach(function(place) {
            let articles = [];
            let wikipediaUrl = 'https://www.wikipedia.org/w/api.php?action=opensearch&search=' +
            place.name() + '&format=json&callback=wikiCallback';
            $.ajax({
                url: wikipediaUrl,
                dataType: 'jsonp',
                success: function(response) {
                    articles = response;
                    place.wikiArticlesUrls = ko.observableArray(articles)
                }
            });
        });
    }

    /**
     * Essa função popula a janela quando o marcador é clicado. Será permitido apenas uma janela 
     * aberta de acordo com o clique, que será populada de acordo com a sua posição no mapa.
     * @param {*} marker 
     * @param {*} infoWindow 
     * @param {*} place
     */
    function populateInfoWindow(marker, infoWindow, place) {
        if (infoWindow.marker != marker) {
            infoWindow.marker = marker;
            infoWindow.setContent(createContentToInfoWindow(place));
            infoWindow.open(this.map, marker)
            infoWindow.addListener('closeclick', function() {
                infoWindow.setMarker = null;
            });
        }
    }

    /**
     * Essa função cria os elementos html inseridos na janela de cada marcador
     * @param {*} place 
     */
    function createContentToInfoWindow(place) {
        let articlesListElemnts = getArticlesElements(place.wikiArticlesUrls())
        return '<div><h3>'+ place.name() + '</h3><p>' + place.description() + '</p>' +
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
        wikipediaArticles[1].forEach(function(articleTitle){
            let url = 'http://www.wikipedia.org/wiki/' + articleTitle;
            let li = '<li><a href="' + url + '">'+ articleTitle +'</a></li>';
            listElements = listElements + li
        })
        return listElements;
    }

};

function initMap() {
    ko.applyBindings(new ViewModel());
}

