/*
 * Basiert auf "Cloropleth" Beispiel: http://bl.ocks.org/mbostock/4060606
 * Swiss TopoJSON data sind von: http://bl.ocks.org/herrstucki/4327678
 * Legende + Zoom von: http://bl.ocks.org/herrstucki/6312708
 */

/* Globale Variablen */
var width = 740;
var height = 650;
// var thresholds = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4];

// TopoJSON Daten aus ch.json
var ch = null;
var svg = null;
var svgKarteZoom = null;
var svgKarte = null;
var svgGemeinden = null;
var svgLegende = null;
var fixArea = false;


// Aggregierte CSV Daten pro Kanton / Verwaltungskreis / Gemeinde
var csvData = null;
var dataByKanton = d3.map();
var dataByKreis = d3.map();
var dataByGemeinde = d3.map();

// Gewaehlter Daten-Selektor / Anteil-Rechner / Klick-Aktion
var dataSelector = selectGemeinde;
var ratioCalculator = anteilAuslaender;
var selectedArea = null;

/* Data Selectors */
function selectKanton(d) {
	return dataByKanton.get("Bern");
}
function selectKreis(d) {
	return dataByKreis.get(d.properties.kreis);
}
function selectGemeinde(d) {
	return dataByGemeinde.get(d.properties.name);
}

/* Ratio Calculators */
function anteilFrauen(subdata) {
	return divide(subdata.frauen, subdata.schueler);
}
function anteilAuslaender(subdata) {
	return divide(subdata.auslaender, subdata.schueler);
}
function anteilFremdsprachige(subdata) {
	return divide(subdata.fremdsprachige, subdata.schueler);
}
function divide(n,d) {
	if (d == 0) return 0;
	else return n / (1.0 * d);
}

/* Zoom Karte auf Bern */
var path = d3.geo.path().projection(null);
function zoomed() {
	svgKarteZoom.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
}
var zoom = d3.behavior.zoom().scaleExtent([0.5, 5]).on("zoom", zoomed); 

/* Legende */
var x = d3.scale.linear()
  .domain([0, 0.4])
  .range([0, 280]);

var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom")
  .tickSize(20)
  .ticks(5)
  .tickFormat(d3.format(".0%"));
  
var quantize = d3.scale.quantize().domain([0.0, 0.4]).range(d3.range(9).map(function(i) {
	return "q" + i + "-9";
}));

/* Konstante Daten: Gemeinden und Verwaltungskreise in Kanton Bern */
var constants = {
	gemeinden : ["Aarberg", "Aarwangen", "Adelboden", "Aefligen", "Aegerten", "Aeschi bei Spiez", "Affoltern im Emmental", "Alchenstorf", "Allmendingen", "Amsoldingen", "Arch", "Arni (BE)", "Attiswil", "Auswil", "Bannwil", "Bargen (BE)", "Beatenberg", "Bellmund", "Belp", "Belprahon", "Bern", "Bettenhausen", "Biel/Bienne", "Biglen", "Bleiken bei Oberdiessbach", "Blumenstein", "Bolligen", "Boltigen", "Bowil", "Bremgarten bei Bern", "Brenzikofen", "Brienz (BE)", "Brienzwiler", "Brügg", "Brüttelen", "Buchholterberg", "Burgdorf", "Burgistein", "Bäriswil", "Bätterkinden", "Bévilard", "Bönigen", "Büetigen", "Büren an der Aare", "Büren zum Hof", "Champoz", "Châtelat", "Corcelles (BE)", "Corgémont", "Cormoret", "Cortébert", "Court", "Courtelary", "Crémines", "Diemerswil", "Diemtigen", "Diessbach bei Büren", "Diesse", "Dotzigen", "Därligen", "Därstetten", "Dürrenroth", "Eggiwil", "Epsach", "Eriswil", "Eriz", "Erlach", "Erlenbach im Simmental", "Ersigen", "Eschert", "Etzelkofen", "Evilard", "Fahrni", "Farnern", "Ferenbalm", "Finsterhennen", "Forst-Längenbühl", "Fraubrunnen", "Frauenkappelen", "Freimettigen", "Frutigen", "Gadmen", "Gals", "Gampelen", "Gerzensee", "Golaten", "Gondiswil", "Graben", "Grafenried", "Grandval", "Grindelwald", "Grossaffoltern", "Grosshöchstetten", "Gsteig", "Gsteigwiler", "Guggisberg", "Gurbrü", "Gurzelen", "Guttannen", "Gündlischwand", "Habkern", "Hasle bei Burgdorf", "Hasliberg", "Heiligenschwendi", "Heimberg", "Heimenhausen", "Heimiswil", "Hellsau", "Herbligen", "Hermrigen", "Herzogenbuchsee", "Hilterfingen", "Hindelbank", "Hofstetten bei Brienz", "Homberg", "Huttwil", "Häutligen", "Iffwil", "Inkwil", "Innertkirchen", "Ins", "Interlaken", "Ipsach", "Iseltwald", "Ittigen", "Jegenstorf", "Jens", "Kallnach", "Kandergrund", "Kandersteg", "Kappelen", "Kaufdorf", "Kehrsatz", "Kernenried", "Kiesen", "Kirchberg (BE)", "Kirchdorf (BE)", "Kirchenthurnen", "Kirchlindach", "Konolfingen", "Koppigen", "Krattigen", "Krauchthal", "Kriechenwil", "Köniz", "La Ferrière", "La Heutte", "La Neuveville", "Lamboing", "Langenthal", "Langnau im Emmental", "Lauenen", "Laupen", "Lauperswil", "Lauterbrunnen", "Leissigen", "Lengnau (BE)", "Lenk", "Leuzigen", "Limpach", "Linden", "Lotzwil", "Loveresse", "Lyss", "Lyssach", "Lüscherz", "Lütschental", "Lützelflüh", "Madiswil", "Malleray", "Matten bei Interlaken", "Mattstetten", "Meikirch", "Meinisberg", "Meiringen", "Melchnau", "Mirchel", "Monible", "Mont-Tramelan", "Moosseedorf", "Moutier", "Muri bei Bern", "Mörigen", "Mühleberg", "Mühledorf (BE)", "Mühlethurnen", "Mülchi", "Münchenbuchsee", "Münchenwiler", "Münchringen", "Münsingen", "Müntschemier", "Neuenegg", "Nidau", "Niederbipp", "Niederhünigen", "Niedermuhlern", "Niederried bei Interlaken", "Niederstocken", "Niederönz", "Niederösch", "Nods", "Noflen", "Oberbalm", "Oberbipp", "Oberburg", "Oberdiessbach", "Oberhofen am Thunersee", "Oberhünigen", "Oberlangenegg", "Oberried am Brienzersee", "Obersteckholz", "Oberthal", "Oberwil bei Büren", "Oberwil im Simmental", "Ochlenberg", "Oppligen", "Orpund", "Orvin", "Ostermundigen", "Perrefitte", "Pieterlen", "Plagne", "Pohlern", "Pontenet", "Port", "Prêles", "Péry", "Radelfingen", "Rapperswil (BE)", "Reconvilier", "Reichenbach im Kandertal", "Reisiswil", "Renan (BE)", "Reutigen", "Riggisberg", "Ringgenberg (BE)", "Roggwil (BE)", "Rohrbach", "Rohrbachgraben", "Romont (BE)", "Rubigen", "Rumisberg", "Röthenbach im Emmental", "Rüderswil", "Rüdtligen-Alchenflüh", "Rüeggisberg", "Rüegsau", "Rümligen", "Rüschegg", "Rüti bei Büren", "Saanen", "Safnern", "Saicourt", "Saint-Imier", "Saxeten", "Schalunen", "Schangnau", "Schattenhalb", "Schelten", "Scheuren", "Schlosswil", "Schwadernau", "Schwarzenburg", "Schwarzhäusern", "Schüpfen", "Seeberg", "Seedorf (BE)", "Seehof", "Seftigen", "Signau", "Sigriswil", "Siselen", "Sonceboz-Sombeval", "Sonvilier", "Sorvilier", "Souboz", "Spiez", "St. Stephan", "Steffisburg", "Stettlen", "Studen (BE)", "Sumiswald", "Sutz-Lattrigen", "Tavannes", "Thierachern", "Thun", "Thunstetten", "Thörigen", "Toffen", "Trachselwald", "Tramelan", "Treiten", "Trimstein", "Trub", "Trubschachen", "Tschugg", "Twann-Tüscherz", "Tägertschi", "Täuffelen", "Uebeschi", "Uetendorf", "Unterlangenegg", "Unterseen", "Ursenbach", "Urtenen-Schönbühl", "Uttigen", "Utzenstorf", "Vauffelin", "Vechigen", "Villeret", "Vinelz", "Wachseldorn", "Wald (BE)", "Walkringen", "Walperswil", "Walterswil (BE)", "Wangen an der Aare", "Wangenried", "Wattenwil", "Wengi", "Wichtrach", "Wiedlisbach", "Wiggiswil", "Wilderswil", "Wiler bei Utzenstorf", "Wileroltigen", "Wimmis", "Wohlen bei Bern", "Wolfisberg", "Worb", "Worben", "Wynau", "Wynigen", "Wyssachen", "Zielebach", "Zollikofen", "Zuzwil (BE)", "Zweisimmen", "Zwieselberg", "Zäziwil"],
	kreise : [{
		"name" : "Arrondissement administratif Jura bernois",
		"gemeinden" : ["Belprahon", "Bévilard", "Champoz", "Châtelat", "Corcelles (BE)", "Corgémont", "Cormoret", "Cortébert", "Court", "Courtelary", "Crémines", "Diesse", "Eschert", "Grandval", "La Ferrière", "La Heutte", "La Neuveville", "Lamboing", "Loveresse", "Malleray", "Monible", "Mont-Tramelan", "Moutier", "Nods", "Orvin", "Perrefitte", "Plagne", "Pontenet", "Prêles", "Péry", "Reconvilier", "Renan (BE)", "Romont (BE)", "Saicourt", "Saint-Imier", "Schelten", "Seehof", "Sonceboz-Sombeval", "Sonvilier", "Sorvilier", "Souboz", "Tavannes", "Tramelan", "Vauffelin", "Villeret"]
	}, {
		"name" : "Verwaltungskreis Bern-Mittelland",
		"gemeinden" : ["Allmendingen", "Arni (BE)", "Belp", "Bern", "Biglen", "Bleiken bei Oberdiessbach", "Bolligen", "Bowil", "Bremgarten bei Bern", "Brenzikofen", "Bäriswil", "Büren zum Hof", "Diemerswil", "Etzelkofen", "Ferenbalm", "Fraubrunnen", "Frauenkappelen", "Freimettigen", "Gerzensee", "Golaten", "Grafenried", "Grosshöchstetten", "Guggisberg", "Gurbrü", "Herbligen", "Häutligen", "Iffwil", "Ittigen", "Jegenstorf", "Kaufdorf", "Kehrsatz", "Kiesen", "Kirchdorf (BE)", "Kirchenthurnen", "Kirchlindach", "Konolfingen", "Kriechenwil", "Köniz", "Laupen", "Limpach", "Linden", "Mattstetten", "Meikirch", "Mirchel", "Moosseedorf", "Muri bei Bern", "Mühleberg", "Mühledorf (BE)", "Mühlethurnen", "Mülchi", "Münchenbuchsee", "Münchenwiler", "Münchringen", "Münsingen", "Neuenegg", "Niederhünigen", "Niedermuhlern", "Noflen", "Oberbalm", "Oberdiessbach", "Oberhünigen", "Oberthal", "Oppligen", "Ostermundigen", "Riggisberg", "Rubigen", "Rüeggisberg", "Rümligen", "Rüschegg", "Schalunen", "Schlosswil", "Schwarzenburg", "Stettlen", "Toffen", "Trimstein", "Tägertschi", "Urtenen-Schönbühl", "Vechigen", "Wald (BE)", "Walkringen", "Wichtrach", "Wiggiswil", "Wileroltigen", "Wohlen bei Bern", "Worb", "Zollikofen", "Zuzwil (BE)", "Zäziwil"]
	}, {
		"name" : "Verwaltungskreis Biel/Bienne",
		"gemeinden" : ["Aegerten", "Bellmund", "Biel/Bienne", "Brügg", "Evilard", "Ipsach", "Lengnau (BE)", "Meinisberg", "Mörigen", "Nidau", "Orpund", "Pieterlen", "Port", "Safnern", "Scheuren", "Schwadernau", "Sutz-Lattrigen", "Twann-Tüscherz"]
	}, {
		"name" : "Verwaltungskreis Emmental",
		"gemeinden" : ["Aefligen", "Affoltern im Emmental", "Alchenstorf", "Burgdorf", "Bätterkinden", "Dürrenroth", "Eggiwil", "Ersigen", "Hasle bei Burgdorf", "Heimiswil", "Hellsau", "Hindelbank", "Kernenried", "Kirchberg (BE)", "Koppigen", "Krauchthal", "Langnau im Emmental", "Lauperswil", "Lyssach", "Lützelflüh", "Niederösch", "Oberburg", "Röthenbach im Emmental", "Rüderswil", "Rüdtligen-Alchenflüh", "Rüegsau", "Schangnau", "Signau", "Sumiswald", "Trachselwald", "Trub", "Trubschachen", "Utzenstorf", "Wiler bei Utzenstorf", "Wynigen", "Zielebach"]
	}, {
		"name" : "Verwaltungskreis Frutigen-Niedersimmental",
		"gemeinden" : ["Adelboden", "Aeschi bei Spiez", "Diemtigen", "Därstetten", "Erlenbach im Simmental", "Frutigen", "Kandergrund", "Kandersteg", "Krattigen", "Oberwil im Simmental", "Reichenbach im Kandertal", "Spiez", "Wimmis"]
	}, {
		"name" : "Verwaltungskreis Interlaken-Oberhasli",
		"gemeinden" : ["Beatenberg", "Brienz (BE)", "Brienzwiler", "Bönigen", "Därligen", "Gadmen", "Grindelwald", "Gsteigwiler", "Guttannen", "Gündlischwand", "Habkern", "Hasliberg", "Hofstetten bei Brienz", "Innertkirchen", "Interlaken", "Iseltwald", "Lauterbrunnen", "Leissigen", "Lütschental", "Matten bei Interlaken", "Meiringen", "Niederried bei Interlaken", "Oberried am Brienzersee", "Ringgenberg (BE)", "Saxeten", "Schattenhalb", "Unterseen", "Wilderswil"]
	}, {
		"name" : "Verwaltungskreis Oberaargau",
		"gemeinden" : ["Aarwangen", "Attiswil", "Auswil", "Bannwil", "Bettenhausen", "Eriswil", "Farnern", "Gondiswil", "Graben", "Heimenhausen", "Herzogenbuchsee", "Huttwil", "Inkwil", "Langenthal", "Lotzwil", "Madiswil", "Melchnau", "Niederbipp", "Niederönz", "Oberbipp", "Obersteckholz", "Ochlenberg", "Reisiswil", "Roggwil (BE)", "Rohrbach", "Rohrbachgraben", "Rumisberg", "Schwarzhäusern", "Seeberg", "Thunstetten", "Thörigen", "Ursenbach", "Walterswil (BE)", "Wangen an der Aare", "Wangenried", "Wiedlisbach", "Wolfisberg", "Wynau", "Wyssachen"]
	}, {
		"name" : "Verwaltungskreis Obersimmental-Saanen",
		"gemeinden" : ["Boltigen", "Gsteig", "Lauenen", "Lenk", "Saanen", "St. Stephan", "Zweisimmen"]
	}, {
		"name" : "Verwaltungskreis Seeland",
		"gemeinden" : ["Aarberg", "Arch", "Bargen (BE)", "Brüttelen", "Büetigen", "Büren an der Aare", "Diessbach bei Büren", "Dotzigen", "Epsach", "Erlach", "Finsterhennen", "Gals", "Gampelen", "Grossaffoltern", "Hermrigen", "Ins", "Jens", "Kallnach", "Kappelen", "Leuzigen", "Lyss", "Lüscherz", "Müntschemier", "Oberwil bei Büren", "Radelfingen", "Rapperswil (BE)", "Rüti bei Büren", "Schüpfen", "Seedorf (BE)", "Siselen", "Studen (BE)", "Treiten", "Tschugg", "Täuffelen", "Vinelz", "Walperswil", "Wengi", "Worben"]
	}, {
		"name" : "Verwaltungskreis Thun",
		"gemeinden" : ["Amsoldingen", "Blumenstein", "Buchholterberg", "Burgistein", "Eriz", "Fahrni", "Forst-Längenbühl", "Gurzelen", "Heiligenschwendi", "Heimberg", "Hilterfingen", "Homberg", "Niederstocken", "Oberhofen am Thunersee", "Oberlangenegg", "Pohlern", "Reutigen", "Seftigen", "Sigriswil", "Steffisburg", "Thierachern", "Thun", "Uebeschi", "Uetendorf", "Unterlangenegg", "Uttigen", "Wachseldorn", "Wattenwil", "Zwieselberg"]
	}],
	gemeinden2Kreise : d3.map()
};
constants.kreise.forEach(function(kreis) {
	kreis.gemeinden.forEach(function(gemeinde) {
		constants.gemeinden2Kreise.set(gemeinde, kreis.name);
	});
});

var stufenFilter = d3.set([10001, 10002, 10003]);
function toggleStufe(btnName, stufeNr) {
	if (stufenFilter.has(stufeNr)) {
		stufenFilter.remove(stufeNr);
		$(btnName).removeClass("selected");
	} else {
		stufenFilter.add(stufeNr);
		$(btnName).addClass("selected");
	}
	recomputeData();
	updateArea();
	areaMouseOverFunction(selectedArea);
}

function toggleRatio(newCalculator, newDomain) {
	
	ratioCalculator = newCalculator;
	quantize.domain(newDomain);
	x.domain(newDomain);
	updateArea();
	areaMouseOverFunction(selectedArea);
}

/**** Start der Applikation ****/
window.onload = function() {
	
	svg = d3.selectAll("#canvas").append("svg").attr("width", width).attr("height", height).call(zoom);
	
	svgKarteZoom = svg.append("g");
	svgKarte = svgKarteZoom.append("g").attr("class", "key")
  	.attr("transform", "translate(-600, -300) scale(2.5)");
	
	svgLegende = svg.append("g")
  .attr("class", "legende")
  .attr("transform", "translate(" + (width - 300) + "," + (height - 40) + ")");
  
	/* Aktionen für Buttons */
	$("#btnKanton").on("click", function(e) {
		$("#btnKanton").addClass("selected");
		$("#btnKreis").removeClass("selected");
		$("#btnGemeinde").removeClass("selected");

		dataSelector = selectKanton;
		updateArea();
		areaMouseOverFunction(selectedArea);
	});
	$("#btnKreis").on("click", function(e) {
		$("#btnKanton").removeClass("selected");
		$("#btnKreis").addClass("selected");
		$("#btnGemeinde").removeClass("selected");

		dataSelector = selectKreis;
		updateArea();
		areaMouseOverFunction(selectedArea);
	});
	$("#btnGemeinde").on("click", function(e) {
		$("#btnKanton").removeClass("selected");
		$("#btnKreis").removeClass("selected");
		$("#btnGemeinde").addClass("selected");

		dataSelector = selectGemeinde;
		updateArea();
		areaMouseOverFunction(selectedArea);
	});

	$("#btnFrauen").on("click", function(e) {
		$("#btnFrauen").addClass("selected");
		$("#btnAuslaender").removeClass("selected");
		$("#btnFremdsprachige").removeClass("selected");

		toggleRatio(anteilFrauen, [0.3, 0.701]);
	});
	$("#btnAuslaender").on("click", function(e) {
		$("#btnFrauen").removeClass("selected");
		$("#btnAuslaender").addClass("selected");
		$("#btnFremdsprachige").removeClass("selected");

		toggleRatio(anteilAuslaender, [0, 0.4]);
	});
	$("#btnFremdsprachige").on("click", function(e) {
		$("#btnFrauen").removeClass("selected");
		$("#btnAuslaender").removeClass("selected");
		$("#btnFremdsprachige").addClass("selected");

		toggleRatio(anteilFremdsprachige, [0, 0.4]);
	});
	$("#btnStufe1").on("click", function(e) {
		toggleStufe("#btnStufe1", 10001);
	});
	$("#btnStufe2").on("click", function(e) {
		toggleStufe("#btnStufe2", 10002);
	});
	$("#btnStufe3").on("click", function(e) {
		toggleStufe("#btnStufe3", 10003);
	});

	// Externe Dateien laden JSON + CSV. Sobald beides bereit ist, wird 'ready' aufgerufen.
	queue().defer(d3.json, "ch.json").defer(d3.csv, "schulstat_clean_2012_20131108.csv", parseRow).await(ready);
};

/* Liest eine Zeile aus der CSV Datei ein */
function parseRow(d) {
	// Entferne Daten für "Total Gemeinde X" oder "Total Schule"
	if (+d.SchuleNr < 10000 && +d.BildungsstufeNr != 10000) {
		return {
			// Text-Werte in Zahlen umwandeln mit '+'
			gemeindeNr : +d.GdeNr,
			gemeinde : d.Gemeinde,
			kreisNr : d.VerwaltungskreisNr,
			kreis : d.Verwaltungskreis,
			schuleNr : +d.SchuleNr,
			schule : d.Schule,
			uSpracheNr : +d.USpracheNr,
			uSprache : d.Unterrichtssprache,
			stufeNr : +d.BildungsstufeNr,
			stufe : d.Bildungsstufe,
			schultypNr : +d.SchultypNr,
			schultyp : d.Schultyp,

			schueler : +d.Anzahl_Schueler,
			frauen : +d.Anzahl_Frauen,
			auslaender : +d.Anzahl_Ausl,
			fremdsprachige : +d.Anzahl_Fremdspr
		};
	} else {
		return null;
	}
};

function aggregateMunicipality(rows, name) {
	
	var data = aggregateData(rows);
	data.name = name;
	data.typ = "Gemeinde";
	data.rows = d3.nest().key(function(row) {
		return row.schule;
	}).rollup(aggregateData).entries(rows).sort(function(a,b){return b.values.schueler - a.values.schueler;});
    data.rowstyp = "Schulen";
	return data;
}
	
function aggregateDistrict(rows, name) {
	
	var data = aggregateData(rows);
	data.name = name;
	data.typ = "Verwaltungskreis";
	data.rows = d3.nest().key(function(row) {
		return row.gemeinde;
	}).rollup(aggregateData).entries(rows).sort(function(a,b){return b.values.schueler - a.values.schueler;}); 
    data.rowstyp = "Gemeinden";
	return data;
}
	
function aggregateCanton(rows, name) {
	
	var data = aggregateData(rows);
	data.name = name;
	data.typ = "Kanton";
	data.rows = d3.nest().key(function(row) {
		return row.kreis;
	}).rollup(aggregateData).entries(rows).sort(function(a,b){return b.values.schueler - a.values.schueler;}); 
    data.rowstyp = "Verwaltungskreise";
	return data;
}

	
/* Berechnet die Spalten-Summe für gewählte Zeilen */
function aggregateData(rows) {
	return {
		schueler : rows.reduce(function(a, b) {
			return a + b.schueler;
		}, 0),
		frauen : rows.reduce(function(a, b) {
			return a + b.frauen;
		}, 0),
		auslaender : rows.reduce(function(a, b) {
			return a + b.auslaender;
		}, 0),
		fremdsprachige : rows.reduce(function(a, b) {
			return a + b.fremdsprachige;
		}, 0)
	};
}

/* Funktion zum einfaerben einer Gemeinde.
 * Input: Die Geimende aus TopoJSON
 * Output: Der CSS class name für die Farbe
 */
function areaColorFunction(topoGemeinde) {
	
	// Daten waehlen
	var subdata = dataSelector(topoGemeinde);

	if (subdata) {
		// Anteil-Wert aus Daten berechnen
		var ratio = ratioCalculator(subdata);

		// Farbe auswaehlen
		return quantize(ratio)  + " gebiet";
	}
};

/* Klick Aktionen */
function areaClickFunction(topoGemeinde) {

	if (topoGemeinde == null) return;
    fixArea = !fixArea;
    areaMouseOverFunction(topoGemeinde);
}

function areaMouseOverFunction(topoGemeinde) {
	
	if (topoGemeinde == null) return;
    if (fixArea) return;
	selectedArea = topoGemeinde;
	
	// Daten waehlen
	var subdata = dataSelector(topoGemeinde);

	if (subdata) {
		// Farbe auswaehlen
		$("#txtInfoTitle").text(subdata.name);
		$("#txtTotal").text("Total " + subdata.typ);
		$("#txtSchueler").text(subdata.schueler);
		$("#txtFrauen").text(subdata.frauen);
		$("#txtAuslaender").text(subdata.auslaender);
		$("#txtFremdsprachige").text(subdata.fremdsprachige);
		$("#txtSubtyp").text(subdata.rowstyp);
		        
		var fields = ["key", "schueler", "frauen", "auslaender", "fremdsprachige"];
		
		d3.select("#infodetails").selectAll("tr").remove();
		d3.select("#infodetails").selectAll("tr").data(subdata.rows)
		  .enter().append("tr").selectAll("td").data(function(d){
		  	return fields.map(function(f){
		  		if (f == "key") return d.key;
                var v = d.values[f];
                if (v == 0) return 0;
		  		return v || "-";
		  	});
		  }).enter().append("td").text(function(d){return d;});
	}
}

/*
 * Wird aufgerufen wenn die Daten geladen wurden.
 */
function ready(error, jsonData, csvData0) {

	ch = jsonData;
	csvData = csvData0;

	// Verwaltungskreis-Info in GEO Daten setzen
	ch.objects.municipalities.geometries.forEach(function(g) {
		var kreis = constants.gemeinden2Kreise.get(g.properties.name);
		g.properties.kreis = kreis;
	});
	
	// Berner Gemeinden auswaehlen
	ch.objects.municipalitiesBern = {
		type : ch.objects.municipalities.type,
		geometries : ch.objects.municipalities.geometries.filter(function(g) {
			return constants.gemeinden.indexOf(g.properties.name) != -1;
		})
	};

	// CSV Daten aggregieren
	recomputeData();

	// Legende (Hintergrund)
  	svgLegende.append("rect")
		.attr("x", -20)
		.attr("y", -10)
		.attr("width", 320)
		.attr("height", 50)
		.style("fill", "#eee")
		.style("fill-opacity", 0.5);
		
	// Legende (Farben)
	svgLegende.selectAll(".band")
		.data(d3.pairs(x.ticks(10)))
		.enter().append("rect")
		.attr("class", "band")
		.attr("height", 12)
		.attr("x", function(d) { return x(d[0]); })
		.attr("width", function(d) { return x(d[1]) - x(d[0]); })
		.attr("class", function(d) { return quantize(d[0]); });

	// Gemeinden einfaerben
	//updateArea();
    createAreas();
};

function recomputeData() {
	
	// CSV Daten filtern
	var filteredData = csvData.filter(function(row) {
		return stufenFilter.has(row.stufeNr);
	});
	
	// CSV Daten aggregieren
	dataByKreis = d3.nest().key(function(row) {
		return row.kreis;
	}).rollup(function(rows) {
		return aggregateDistrict(rows, rows[0].kreis);
	}).map(filteredData, d3.map);
	
	dataByGemeinde = d3.nest().key(function(row) {
		return row.gemeinde;
	}).rollup(function(rows) {
		return aggregateMunicipality(rows, rows[0].gemeinde);
	}).map(filteredData, d3.map);

	dataByKanton.set("Bern", aggregateCanton(filteredData, "Bern"));

	constants.kreise.forEach(function(kreis) {
		if (!dataByKreis.has(kreis.name)) {
			dataByKreis.set(kreis.name, aggregateDistrict([], kreis.name));
		}
	});
	constants.gemeinden.forEach(function(name) {
		if (!dataByGemeinde.has(name)) {
			dataByGemeinde.set(name, aggregateMunicipality([], name));
		}
	});
}

function createAreas() {
  	// Legende (Text)
	svgLegende.call(xAxis);

	// Gemeinden einfaerben
	svgGemeinden = svgKarte.append("g");
    
    svgGemeinden.selectAll("path")// Selektion
	   .data(topojson.feature(ch, ch.objects.municipalitiesBern).features)// GIS Daten
	   .enter().append("path").attr("class", areaColorFunction).attr("d", path)// Gebiet einfaerben
	   .on("mouseover", areaMouseOverFunction)// Klick Aktion
	   .on("click", areaClickFunction)// Klick Aktion
	; 

	// Grenzen zwischen Gemeinden zeichnen
	svgKarte.append("path").datum(topojson.mesh(ch, ch.objects.municipalitiesBern, function(a, b) {
		return a !== b;
	})).attr("class", "grenzen2").attr("d", path); 

	// Grenzen zwischen Verwaltungskreisen zeichnen
	svgKarte.append("path").datum(topojson.mesh(ch, ch.objects.municipalities, function(a, b) {
		return a.properties.kreis !== b.properties.kreis;
	})).attr("class", "grenzen1").attr("d", path);

};

function updateArea() {
  
  	// Legende (Text)
	svgLegende.call(xAxis);

	// Gemeinden einfaerben
    //svgGemeinden.selectAll("path").remove();
	svgGemeinden.selectAll("path")// Selektion
	   .data(topojson.feature(ch, ch.objects.municipalitiesBern).features)// GIS Daten
	   .attr("class", areaColorFunction)// Gebiet einfaerben
	; 
};
