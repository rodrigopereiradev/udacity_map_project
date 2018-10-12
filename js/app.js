
 const ViewModel = function () {
     let map;
     map = new google.maps.Map(document.getElementById('map'), {
         center: {lat: -15.7801, lng: -47.9292},
         zoom: 11
     });
 };

function initMap() {
    ko.applyBindings(new ViewModel());
}

