/* This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Lesser General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>. 
 */

$(function() {
    var guiConfig = {
        mapToken : 'pk.eyJ1IjoibG9yYW5nZXIiLCJhIjoiejRVMGVrOCJ9._o2jt-C_gsrjzE6F4XbbUA',
        origin : L.latLng(43.61, 3.87),
        zoom : 13,
        maxZoom : 18,
        bikeSpeed : 2.8,
        walkSpeed : 1.0,
        routerid : 'montpellier',
        date : '2014/10/01',
        time : '10:00:00',
        mode : 'WALK,TRANSIT',
        precisionMeters : 80,
        offRoadDistanceMeters : 150,
        isotimes : [ 20 * 60, 30 * 60, 40 * 60 ]
    };
    var poisConfig = {
        url : 'http://wcf.tourinsoft.com/Syndication/3.0/cdt34/',
        ids : [ 'cb187571-3b44-4d80-93e4-ae6ac2e720d9', '3b45b39e-68d8-4fd5-8ebd-1c4f9bbe09e4',
                'd968ae4c-49af-4789-9456-89668c507465', '3970d056-315d-4ad1-8e41-e412c414ae04' ]
    };
    var geocodeConfig = {
        key : "R4BNuAmIe5Lk57qGEqgnrV5LELqD0cH1"
    }
    var geocoder = new otp.client.Geocoder(geocodeConfig);
    var poisSource = new otp.client.Pois(poisConfig);
    var gui = new otp.client.Gui(guiConfig, poisSource, geocoder);
});