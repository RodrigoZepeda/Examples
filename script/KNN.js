// Set the dimensions and margins of the diagram
var margin = { top: 20, right: 30, bottom: 30, left: 20 },
    canvas = {
        width: 500 - margin.left - margin.right,
        height: 500 - margin.top - margin.bottom,
        max: { "x": 0, "y": 0 },
        min: { "x": 0, "y": 0 },
        clicks: 0,
        npoints: 100,
        radius: 5,
        factor: NaN
    },
    knn = {
        kfig: "visible",
        k: 5,
        circ: false,
        rect: false,
        classify: false
    },
    color = {
        A: "orange",
        B: "green",
        U: "red"
    };

document.getElementById("borrar").onclick = function() {
    window.location.reload();
}

document.getElementById("classify").onchange = function() {
    knn.classify = document.getElementById("classify").checked;
    if (knn.classify & !(knn.rect || knn.circ)) {
        knn.circ = true;
        document.getElementById("circulo").checked = true;
    }
    drawData(data);
}

//Delete point when pressing sup or delete
document.addEventListener('keydown', function(e) {
    if (e.keyCode == 8 || e.keyCode == 46) {
        if (data.length > canvas.npoints) {
            canvas.clicks -= 1;
            data.pop();
            drawData(data);
        }
    }
}, false);

//Change on number of points
document.getElementById("ssize").onchange = function() {
    var varn = +document.getElementById("ssize").value;
    if (varn > 2500) {
        document.getElementById("ssize").value = 2500;
        canvas.npoints = 2500;
    } else {
        canvas.npoints = varn
    }
    var data = getData(canvas.npoints);
    drawData(data);
}

//Change on number of neighbors k
document.getElementById("k").onchange = function() {
    var varn = +document.getElementById("k").value;
    if (varn > 99) {
        document.getElementById("k").value = 99;
        knn.k = 99;
    } else {
        knn.k = varn;
    }
    drawData(recalculateNeighbors(data, knn.k), false);
}

//Change on norm infinity
document.getElementById("cuadrado").onchange = function() {
    knn.rect = document.getElementById("cuadrado").checked;
    if (knn.classify & !(knn.rect || knn.circ)) {
        knn.classify = false;
        document.getElementById("classify").checked = false;
    }
    drawData(data);
}

//Change on norm 2
document.getElementById("circulo").onchange = function() {
    knn.circ = document.getElementById("circulo").checked;
    if (knn.classify & !(knn.rect || knn.circ)) {
        knn.classify = false;
        document.getElementById("classify").checked = false;
    }
    drawData(data);
    drawData(data);
}

//Reset document on load
function startload() {

    //Starting values
    document.getElementById("ssize").value = canvas.npoints;
    document.getElementById("k").value = knn.k;
    document.getElementById("cuadrado").checked = knn.rect;
    document.getElementById("circulo").checked = knn.circ;
    document.getElementById("classify").checked = knn.classify;

    //Create dafault data
    var data = getData(canvas.npoints);
    drawData(data);
}

//Calculate how many A and B are in the vicinity of the clickable points
//find the k nearest neighbors in square norm
function getKNN(p, norm) {

    var distances = [];

    //Calculate distance to each point
    for (var i = 0; i < canvas.npoints; i++) {
        distances.push({
            "d": distance(p, data[i], norm),
            "color": data[i].color
        });
        if (i == canvas.npoints - 1) {
            var neighbors = get_k_neighbors(sortdistance(distances), knn.k);
        }
    }

    return neighbors;
}

function sortdistance(distances) {

    //Sort list by distance
    distances.sort(function(a, b) {
        return ((a.d < b.d) ? -1 : ((a.d == b.d) ? 0 : 1));
    });

    return distances;
}

function get_k_neighbors(dlist, k) {
    var neighbors = { "A": 0, "B": 0, "r": dlist[k - 1].d };
    for (var j = 0; j < k; j++) {
        if (dlist[j].color == color.A) {
            neighbors.A += 1;
        } else if (dlist[j].color == color.B) {
            neighbors.B += 1;
        }
    }
    return neighbors;
}

function distance(p, q, norm) {
    var dist;
    if (norm == Infinity) {
        dist = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y));
    } else if (norm == 2) {
        dist = Math.sqrt(Math.pow(q.x - p.x, 2) + Math.pow(q.y - p.y, 2));
    }
    return dist;
}



//Function for classification
function classifycolor(d, fig, classify) {
    var mycolor = "black";
    if (d.color == color.A || d.color == color.B) {
        mycolor = d.color;
    } else {
        if (classify) {
            var neighbors = getKNN(d, fig)
            if (neighbors.B > neighbors.A) {
                mycolor = color.B;
            } else if (neighbors.A > neighbors.B) {
                mycolor = color.A;
            }
        } else {
            mycolor = color.U;
        }

    }
    return mycolor;
}


//Add svg element to contain knn    
var svg = d3.select("#knn").append("svg")
    .attr("width", canvas.width + margin.left + margin.right)
    .attr("height", canvas.height + margin.top + margin.bottom)
    .attr("id", "knnpoints")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip well")
    .style("opacity", 0);

// Add tooltip
var div2 = d3.select("body").append("div")
    .attr("class", "tooltip2 well")
    .style("opacity", 0);

var div3 = d3.select("body").append("div")
    .attr("class", "tooltip2 well")
    .style("opacity", 0);

//Function for drawing data
function drawData(data) {

    //Remove class
    removeElementsByClass("svgobject");

    //Add axis
    canvas.max = Math.max(
        d3.max(data, function(d) { return d.x; }),
        d3.max(data, function(d) { return d.y; }));

    canvas.min = Math.min(
        d3.min(data, function(d) { return d.x; }),
        d3.min(data, function(d) { return d.y; }));

    canvas.factor = (canvas.max - canvas.min) / (canvas.width);

    var Xscale = d3.scaleLinear()
        .range([0, canvas.width])
        .domain([canvas.min, canvas.max]);

    var Yscale = d3.scaleLinear()
        .range([canvas.height, 0])
        .domain([canvas.min, canvas.max]);

    svg.append("g")
        .attr("class", "x axis svgobject")
        .attr("transform", "translate(0," + Yscale(0) + ")")
        .call(d3.axisBottom(Xscale));

    svg.append("g")
        .attr("class", "y axis svgobject")
        .attr("transform", "translate(" + Xscale(0) + ",0 )")
        .call(d3.axisLeft(Yscale));

    //Create vector of appendable figures
    var fignames = [];
    var norm;
    if (knn.circ) { fignames.push("circle"); }
    if (knn.rect) { fignames.push("rect"); }

    //Add vicinity according to distance measure
    for (var j = 0; j < fignames.length; j++) {

        //Create figure
        var figure = svg.selectAll("dot")
            .data(data)
            .enter().append(fignames[j]);

        //Specify center if circle or coordinates if square
        if (fignames[j] == "circle") {
            norm = 2;
            figure.attr("cx", function(d) { return Xscale(d.x); })
                .attr("cy", function(d) { return Yscale(d.y); })
                .attr("r", function(d) {
                    return (d.rcirc * 1.0 / canvas.factor);
                });
        } else if (fignames[j] == "rect") {
            norm = Infinity;
            figure.attr("x", function(d) { return Xscale(d.x) - (d.rsquare * 1.0 / canvas.factor); })
                .attr("y", function(d) { return Yscale(d.y) - (d.rsquare * 1.0 / canvas.factor); })
                .attr("width", function(d) {
                    return (d.rsquare * 2.0 / canvas.factor);
                })
                .attr("height", function(d) {
                    return (d.rsquare * 2.0 / canvas.factor);
                })
        }


        figure.attr("class", "mycirc svgobject")
            .classed("circdata", fignames[j] == "circle")
            .classed("rectdata", fignames[j] == "rect")
            .classed("mousedata", function(d) { return d.fig != "hidden" })
            .attr("stroke", function(d) { return classifycolor(d, norm, knn.classify); })
            .attr("stroke-width", 1)
            .style("fill", function(d) { return classifycolor(d, norm, knn.classify); })
            .style("visibility", function(d) { return d.fig; })
            .style("fill-opacity", 0.2)
            .on("mouseover", function(d) {
                if (d.fig == "visible") {
                    var neighbors = d.neighbors_2;
                    div3.transition()
                        .duration(200)
                        .style("opacity", 1);
                    div3.text("( A = " + neighbors.A + ", V = " + neighbors.B + ")")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                    div3.style("background-color", color.U);
                }
            })
            .on("mouseout", function(d) {
                if (d.fig == "visible") {
                    div3.transition()
                        .duration(500)
                        .style("opacity", 0);
                }
            });

    }

    // Add the scatterplot
    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "mydot svgobject ")
        .attr("r", function(d) { return (d.rdot); })
        .attr("cx", function(d) { return Xscale(d.x); })
        .attr("cy", function(d) { return Yscale(d.y); })
        .classed("mousedata", function(d) { return d.fig != "hidden" })
        .style("fill", function(d) { return (d.color); })
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", 1);
            div.text("(" + Math.round(100 * d.x) / 100 + "," + Math.round(100 * d.y) / 100 + ")")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            div.style("background-color", d.color);
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });



    svg.on("click", function(e) {

        //Cound added point 
        canvas.clicks += 1;

        //Get coordinates (pixels)
        var coords = d3.mouse(this);
        var myclick = {
            "x": Xscale.invert(coords[0]),
            "y": Yscale.invert(coords[1])
        };
        var sqneighbors = getKNN(myclick, Infinity);
        var circneighbors = getKNN(myclick, 2);

        data.push({
            "x": myclick.x,
            "y": myclick.y,
            "color": color.U,
            "neighbors_Inf": sqneighbors,
            "neighbors_2": circneighbors,
            "rdot": 5,
            "rsquare": sqneighbors.r,
            "rcirc": circneighbors.r,
            "fig": knn.kfig
        });

        //Re-draw plot
        drawData(data);
    });
}

//On start create random data set
document.body.onload = function() {
    startload()
}

//Remove objects 
//http://stackoverflow.com/questions/4777077/removing-elements-by-class-name
function removeElementsByClass(className) {
    var elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

//Generate random data
function getData(npoints) {

    //Create data vectior
    data = [];

    //Loop creating random points
    for (var i = 0; i < npoints; i++) {

        //Randomly generate color to which it belongs
        var mycolor = color.B,
            myneighbors = { "A": 0, "B": Infinity, "r": 0 },
            params = { mu: 0, sigma: 1 };


        if (d3.randomUniform(0, 1)() < 0.5) {
            mycolor = color.A;
            myneighbors = { "A": Infinity, "B": 0, "r": 0 };
            params = { mu: 1.5, sigma: 1 };
        }

        var x = d3.randomNormal(params.mu, params.sigma)();
        var y = d3.randomNormal(params.mu, params.sigma)();

        el = {
            "x": x,
            "y": y,
            "color": mycolor,
            "neighbors": myneighbors,
            "rcirc": 0,
            "rsquare": 0,
            "rdot": canvas.radius,
            "fig": "hidden"
        }

        data.push(el);
    };

    return data;
}

function recalculateNeighbors(data) {
    var circneighbors, squareneighbors;
    for (var i = canvas.npoints; i < data.length; i++) {
        circneighbors = getKNN(data[i], 2);
        squareneighbors = getKNN(data[i], Infinity);
        data[i].neighbors_2 = circneighbors;
        data[i].rcirc = circneighbors.r;
        data[i].neighbors_Inf = squareneighbors;
        data[i].rsquare = squareneighbors.r;
    }
    return data;
}