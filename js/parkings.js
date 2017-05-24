var formrepo_save = "<input type='text' placeholder='GitHub User' " +
    "id='user1' size='10' /><br>" +
    "<input type='text' placeholder='GitHub Repo' " +
    "id='repo1' size='10' /><br>" +
    "<input type='text' placeholder='GitHub Token' " +
    "id='token1' size='10' /><br>" +
    "<button id='toSave' type='button'>Save!</button>";
var formrepo_load = "<input type='text' placeholder='GitHub User' " +
    "id='user2' size='10' /><br>" +
    "<input type='text' placeholder='GitHub Repo' " +
    "id='repo2' size='10' /><br>" +
    "<input type='text' placeholder='GitHub Token' " +
    "id='token2' size='10' /><br>" +
    "<button id='toLoad' type='button'>Load!</button>";
var lookup = [];
var parkings_collections = new Object();
var users_collections = new Object();
var parkings_readed = false;
var user_ids_list = [];
var connection;
var parking_name ="";
var apiKey='AIzaSyDwhyjPlqiGLl3f1Ze3LH0nPsJr9HS0weU';

function onLoadCallback() {
	gapi.client.setApiKey(apiKey);
}

function isLocationFree(search) {
  for (var i = 0, l = lookup.length; i < l; i++) {
    if (lookup[i] == search) {
      return false;
    }
  }
  return true;
}

function isUserLoaded(user) {
	console.log("Checking: "+user);
  for (var i = 0, l = user_ids_list.length; i < l; i++) {
    if (user_ids_list[i] == user) {
    	console.log("User is loaded");
      return true;
    }
  }
  console.log("User is never loaded!")
  return false;
}

function isUserStored(user, parking) {
	console.log("Checking: "+user+" in: "+parking);
  for (var i = 0, l = users_collections[parking].length; i < l; i++) {
    if (users_collections[parking][i] == user) {
    	console.log("User is stored");
      return true;
    }
  }
  console.log("User is never stored!")
  return false;
}

function showParkings(){
	var parking_info = parkings_list[$(this).attr('no')];
	parking_name = parking_info.title;
	var street = parking_info.address["street-address"];
	var locality = parking_info.address.locality;
	var CP = parking_info.address["postal-code"];
	var lat = parking_info.location.latitude;
	var lon = parking_info.location.longitude;
	var info = parking_info.organization["organization-desc"];

	var myLatLng = lat+","+ lon;
	if (isLocationFree(myLatLng) == true) {
		var marker = L.marker([lat, lon],{riseOnHover: true}).addTo(mymap);
		marker.bindPopup("<b>"+parking_name+"</b><br>"+street).openPopup();
		lookup.push(myLatLng);

		marker.on("dblclick",function() {
			var index = lookup.indexOf(myLatLng);
			if (index >= 0) {
  				lookup.splice( index, 1 );
			}
			mymap.removeLayer(marker);
		});

		marker.on("click",function() {
			showInfoParkings(parking_name,toWrite,lat,lon);
		});
	}

	var toWrite = "<span>"+street+" , "+locality+"("+CP+")</span><br><span>"+info+"</span>";

	showInfoParkings(parking_name,toWrite,lat,lon);
	showUsers(parking_name);
};

function showInfoParkings(name,info,latitude,longitude) {
	getParkingPhoto(latitude ,longitude);
	$( "#parking-description" ).html("<h3>"+name+"</h3><br>"+info);
	$( "#info-header" ).html(name);
	$( "#info-desc").html(info)
	$( "#PARKING_INFO").show("slow");
}

function getParkings(){
	if (parkings_readed == false) {
		$.getJSON("./parkings.json", function(data) {
			parkings_list = data["@graph"];
			var l = '';
			for (var i = 0; i < parkings_list.length; i++) {
				l = l + '<li class="draggable1" type="disc" no=' + i + '>' + parkings_list[i].title + '</li>';
			}
			$('#list').append(l);
			$('.draggable1').click(showParkings);
        	$(".draggable1").hover(
                function(){
                    $(this).css("fontSize", "1.3em");
                }, 
                function(){
                    $(this).css("fontSize", "1em");
                }
         	);
			$( '.draggable1' ).draggable({revert: true, appendTo: "body", helper: "clone"});

			for (var i = 0; i < parkings_list.length; i++) {
				var ids = [];
				users_collections[parkings_list[i].title] = ids;
			}
			parkings_readed = true;
		});
	}
};

function getParkingPhoto(latitude,longitude) {
	var url = "https://commons.wikimedia.org/w/api.php?format=json&action=query&generator=geosearch&ggsprimary=all&ggsnamespace=6&ggsradius=200&ggscoord="+latitude+"|"+longitude+"&ggslimit=4&prop=imageinfo&iilimit=1&iiprop=url&iiurlwidth=200&iiurlheight=200&callback=?"
	$.getJSON(url, function(data) {
		photo_list = data.query.pages;
		var i = 0;
		for ( var key in photo_list) {
			$( "#photo"+i ).attr("src",photo_list[key].imageinfo[0].url)
			console.log("Foto "+i+" , URL = "+photo_list[key].imageinfo[0].url);
			i++;
		}
	})
	.fail(function(error) {
		console.log("Error leyendo URL = "+url);
	});
}

function addCollection (ev) {
	ev.preventDefault();

	var colletion_name = $( "#new-collection" ).val();
	$( "#new-collection" ).val("");

	if ( colletion_name == "" ) {
		return;
	}

	$( "#collections ul" ).append("<li>"+colletion_name+"</li>");

	var collection = [];
	parkings_collections[colletion_name] = collection;

	showCollection();
}

function showCollection() {
	$( "#collections ul").click(function (event) {
		var coll_name = $( event.target).text();
		$( "#collection-name ul" ).html("<li>"+coll_name+"</li>");
		$( "#parkings-list ul" ).html("");
		$( "#info-collection-name ul" ).html("<li>"+coll_name+"</li>");
		$( "#info-collecion ul" ).html("");

		parkings_collections[coll_name].forEach(function (n) {
			$( "#parkings-list ul" ).append("<li>"+n+"</li>");
			$( "#info-collecion ul" ).append('<li>'+n+'</li>');
		});
	});	
}

function showUsers(parking) {
		$( "#users ul" ).html("");
		users_collections[parking].forEach(function (n) {
			ShowGPlusUser(n,false);
		});
}

function Drop(event, ui) {
	var coll_name = $( "#collection-name ul" ).text();
		
	if (coll_name == ""){
		return;
	}
	var parking = ui.draggable.text();
	parkings_collections[coll_name].push(parking);
	$( "#parkings-list ul" ).append("<li>"+parking+"</li>");
}

function Drop2(event, ui) {
	console.log("parking_name : "+parking_name);
	if (parking_name == ""){
		return;
	}
	var user = ui.draggable.text();
	if (isUserStored(user,parking_name) == true){
		return;
	}
	ShowGPlusUser(user,true);
}

function saveCollections() {
	$( "#save-form" ).html(formrepo_save);
	$( "#toSave" ).click(function() {
		var user = $("#user1").val();
		var repo = $("#repo1").val();
		var token = $("#token1").val();
		var github = new Github({
				token:token,
				auth:"oauth"
			});

		var texto = JSON.stringify(parkings_collections);
		var repository = github.getRepo(user, repo);
		console.log("User: "+user+" , Repo: "+repo+" , Token: "+token+" , Texto: "+texto);
		repository.write("master", "datafile", texto, "File with parkings collections", function(err) {
		    console.log (err)
		});
		$( "#save-form" ).html("");
	});
}

function loadCollections() {
	$( "#load-form" ).html(formrepo_load);
	$( "#toLoad" ).click(function() {
		var user = $("#user2").val();
		var repo = $("#repo2").val();
		var token = $("#token2").val();
		var github = new Github({
				token:token,
				auth:"oauth"
			});
		var repository = github.getRepo(user, repo);
		repository.read('master', 'datafile', function(err, data) {
			console.log (err, data);
			var collections_load = JSON.parse(data);

			$.each(collections_load,function(key,value){
					parkings_collections[key] = value;
					console.log(key);
					$( "#collections ul" ).append("<li>"+key+"</li>");
			});

			showCollection();
	    });

		$( "#load-form" ).html("");
	})

}

function addUser(user) {
	user_ids_list.push(user);
	$( "#user_ids" ).append("<li>"+user+"</li>");
	$( '#user_ids li' ).draggable({revert: true, appendTo: "body", helper: "clone"});
}

function ShowGPlusUser(user, store) {
	gapi.client.load('plus', 'v1', function() {
		var request = gapi.client.plus.people.get({
			'userId': user
		});

		request.execute(function(resp) {
			if (store){
				users_collections[parking_name].push(user);
			}
			$( "#users ul" ).append("<br><li type='square'><img src='"+resp.image.url+"'> "+resp.displayName+"</li>");
		});
	});
}

$(document).ready(function() {
	$( ".go-up" ).click(function(){
		$('body, html').animate({
			scrollTop: '0px'
		}, 500);
	});

	$( window ).scroll(function(){
		if( $(this).scrollTop() > 0 ){
			$('.go-up').slideDown(300);
		} else {
			$('.go-up').slideUp(300);
		}
	});

	$( ".go-up" ).hover(function() {
      	$(this).stop().animate({ opacity: 1 });
   		}, function() {
      		$(this).stop().animate({ opacity: 0.4 }); 
	});

	$('#share').socialShare({
			social: 'facebook,twitter,google,pinterest,linkedin',
			whenSelect: true,
			selectContainer: '.shareSelector',
			blur: true
	});

	$( '#user_ids li' ).draggable({revert: true, appendTo: "body", helper: "clone"});

	$( "#PARKING_INFO").hide();
	mymap = L.map('map').setView([40.4167, -3.7038], 13);
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    	attribution: 'Map parkings data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    	maxZoom: 18
	}).addTo(mymap);

	$( '#parkings-list' ).droppable( {
      classes: {
        "ui-droppable-hover": "ui-state-hover"
      },
      tolerance: "touch",
      accept : "#list li",
      drop: Drop
    });
    $( '#users' ).droppable( {
      classes: {
        "ui-droppable-hover": "ui-state-hover"
      },
      tolerance: "touch",
      accept : "#user_ids li",
      drop: Drop2
    });
	
	$( "#getParkings" ).click(getParkings);
	$( "#collection-form" ).submit(event,addCollection);
	$( "#save-btn" ).click( function() {
		saveCollections();
	});
	$( "#load-btn" ).click( function() {
		loadCollections();
	});
	$( "#get-users" ).click( function() {
		alert("Downloading Google+ users ids...");
		connection = new WebSocket('ws://localhost/echo');
		connection.onmessage = function (e) {
			if (isUserLoaded(e.data) == false) {
    			addUser(e.data);
    		}
		};
	});
	$( "#stop" ).click(function() {
		alert("Stop downloading Google+ users ids...");
		connection.close();
	});

});