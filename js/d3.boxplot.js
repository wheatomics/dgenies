if (!d3) {
    throw "d3 wasn't included!"
}
d3.boxplot = {};

//GLOBAL VARIABLES:
d3.boxplot.id_res = null;

d3.boxplot.svgcontainer = null;
d3.boxplot.container = null;
d3.boxplot.svgsupercontainer = null;
d3.boxplot.name_x = null;
d3.boxplot.name_y = null;
d3.boxplot.lines = null;
d3.boxplot.x_len = null;
d3.boxplot.y_len = null;
d3.boxplot.x_zones = null;
d3.boxplot.y_zones = null;
d3.boxplot.zoom_enabled = true;
d3.boxplot.min_idy = 0;
d3.boxplot.max_idy = 0;
d3.boxplot.zone_selected = false;

//For translations:
d3.boxplot.translate_start = null;
d3.boxplot.posX = null;
d3.boxplot.posY = null;
d3.boxplot.old_translate = null;

//Graphical parameters:
d3.boxplot.scale = 1000;
d3.boxplot.content_lines_width = d3.boxplot.scale / 400;
d3.boxplot.break_lines_width = d3.boxplot.scale / 1500;
d3.boxplot.color_idy = {
    "pos+": "#063806",
    "pos-": "#99d78d",
    "neg+": "#d69185",
    "neg-": "#540404"
};
d3.boxplot.limit_idy = null;
d3.boxplot.min_idy_draw = 0;
d3.boxplot.min_size = 0;
d3.boxplot.linecap = "round";
d3.boxplot.background_axis = "#f4f4f4";
d3.boxplot.break_lines_color = "#7c7c7c";

//Filter sizes:
d3.boxplot.min_sizes = [0, 0.01, 0.02, 0.03, 0.05, 1, 2];

d3.boxplot.init = function (id, from_file=false) {
    d3.boxplot.id_res = id;
    $("#filter_size").val(0);
    $("#stroke-linecap").prop("checked", false);
    $("#stroke-width").val(1);
    if (!from_file) {
        $.post("/get_graph",
            {"id": id},
            function (data) {
                if (data["success"])
                    d3.boxplot.launch(data);
                else {
                    $("#supdraw").html($("<p>").html("This job does not exists!").css("margin-top", "15px"));
                }
            }
        )
    }
    else {
        $.get(id,
            {},
            function (data) {
                d3.boxplot.launch(data);
            })
    }
};

d3.boxplot.launch = function(res, update=false) {
    if (res["sorted"]) {
        $("button#sort-contigs").text("Undo sort");
    }
    else {
        $("button#sort-contigs").text("Sort contigs");
    }
    d3.boxplot.name_x = res["name_x"];
    d3.boxplot.name_y = res["name_y"];
    d3.boxplot.lines = res["lines"];
    d3.boxplot.x_len = res["x_len"];
    d3.boxplot.y_len = res["y_len"];
    d3.boxplot.min_idy = res["min_idy"];
    d3.boxplot.max_idy = res["max_idy"];
    d3.boxplot.limit_idy = res["limit_idy"];
    d3.boxplot.draw(res["x_contigs"], res["x_order"], res["y_contigs"], res["y_order"]);
    if (!update) {
        $("div#draw").resizable({
            aspectRatio: true
        });
        d3.boxplot.events.init();
        d3.boxplot.controls.init();
    }
};

d3.boxplot.select_zone = function (x, y) {
    if (!d3.boxplot.zone_selected) {
        d3.boxplot.zone_selected = true;
        let x_zone = null,
            y_zone = null;

        //Search zone for X axis:
        for (let zone in d3.boxplot.x_zones) {
            if (d3.boxplot.x_zones[zone][0] < x && x <= d3.boxplot.x_zones[zone][1]) {
                x_zone = zone;
                break;
            }
        }

        //Search zone for Y axis:
        for (let zone in d3.boxplot.y_zones) {
            if (d3.boxplot.y_zones[zone][0] < y && y <= d3.boxplot.y_zones[zone][1]) {
                y_zone = zone;
                break;
            }
        }

        //Compute X and Y scales to zoom into zone:
        let x_len_zone = d3.boxplot.x_zones[x_zone][1] - d3.boxplot.x_zones[x_zone][0];
        let y_len_zone = d3.boxplot.y_zones[y_zone][1] - d3.boxplot.y_zones[y_zone][0];
        let scale_x = d3.boxplot.scale / x_len_zone;
        let scale_y = d3.boxplot.scale / y_len_zone;

        //
        // let lines_s = [];
        //
        // let my_x_zone = [d3.boxplot.x_zones[x_zone][0] / d3.boxplot.scale * d3.boxplot.x_len, d3.boxplot.x_zones[x_zone][1] / d3.boxplot.scale * d3.boxplot.x_len];
        // let my_y_zone = [d3.boxplot.y_zones[y_zone][0] / d3.boxplot.scale * d3.boxplot.y_len, d3.boxplot.y_zones[y_zone][1] / d3.boxplot.scale * d3.boxplot.y_len];
        //
        // for (let l in d3.boxplot.lines) {
        //     let line = d3.boxplot.lines[l].slice(0);
        //     if (((line[0] >= my_x_zone[0] && line[0] < my_x_zone[1]) || (line[1] >= my_x_zone[0] && line[1] < my_x_zone[1]))
        //         && ((line[2] >= my_y_zone[0] && line[2] < my_y_zone[1]) ||
        //             (line[3] >= my_y_zone[0] && line[3] < my_y_zone[1]))) {
        //         //console.log(line);
        //         line[0] -= my_x_zone[0];
        //         line[1] -= my_x_zone[0];
        //         line[2] -= my_y_zone[0];
        //         line[3] -= my_y_zone[0];
        //         if (line[1] < 0)
        //             console.log("WARN!!!", line[0]);
        //         //console.log(line);
        //         lines_s.push(line);
        //     }
        // }
        //
        // d3.selectAll("line.content-lines").remove();
        // d3.boxplot.draw_lines(lines_s, my_x_zone[1] - my_x_zone[0], my_y_zone[1] - my_y_zone[0]);

        //Zoom in:
        d3.boxplot.container
           .attr("transform", "scale(" + scale_x + "," + scale_y + ")" +
               "translate(-" + (d3.boxplot.x_zones[x_zone][0]) + ",-" + (d3.boxplot.scale - d3.boxplot.y_zones[y_zone][1]) + ")");
        // Correct lines stroke width to be not impacted by the zoom:
        d3.selectAll(".content-lines").attr("stroke-width", d3.boxplot.content_lines_width / Math.min(scale_x, scale_y));
        d3.selectAll("line.break-lines").style("visibility", "hidden");

        //Update left and bottom axis:
        let y_max = d3.boxplot.y_zones[y_zone][1] / d3.boxplot.scale * d3.boxplot.y_len;
        let y_min = d3.boxplot.y_zones[y_zone][0] / d3.boxplot.scale * d3.boxplot.y_len;
        d3.boxplot.draw_left_axis(y_max-y_min, 0);
        let x_max = d3.boxplot.x_zones[x_zone][1] / d3.boxplot.scale * d3.boxplot.x_len;
        let x_min = d3.boxplot.x_zones[x_zone][0] / d3.boxplot.scale * d3.boxplot.x_len;
        d3.boxplot.draw_bottom_axis(x_max - x_min, 0);

        //Update top and right axis:
        let pseudo_x_zones = {};
        pseudo_x_zones[x_zone] = [0, d3.boxplot.x_len];
        d3.boxplot.draw_top_axis(pseudo_x_zones);
        let pseudo_y_zones = {};
        pseudo_y_zones[y_zone] = [0, d3.boxplot.y_len];
        d3.boxplot.draw_right_axis(pseudo_y_zones);

        d3.boxplot.zoom_enabled = false;
    }
};

d3.boxplot.reset_scale = function () {
    $("#loading").show();
    window.setTimeout(() => {
        //Reset scale:
        d3.boxplot.container.attr("transform", "scale(1,1)translate(0,0)");

        //Restore lines stroke width:
        d3.selectAll("path.content-lines").attr("stroke-width", d3.boxplot.content_lines_width);
        d3.selectAll("line.break-lines").style("visibility","visible");
        d3.selectAll("line.break-lines").attr("stroke-width", d3.boxplot.break_lines_width);

        //Update left and bottom axis:
        d3.boxplot.draw_left_axis(d3.boxplot.y_len);
        d3.boxplot.draw_bottom_axis(d3.boxplot.x_len);

        //Update top and right axis:
        d3.boxplot.draw_top_axis();
        d3.boxplot.draw_right_axis();

        d3.boxplot.zone_selected = false;

        $("#loading").hide();

        //Re-enable zoom:
        d3.boxplot.zoom_enabled = true;
    }, 0);
    //
    // //Restore axis:
    // d3.boxplot.draw_left_axis(d3.boxplot.y_len);
    // d3.boxplot.draw_bottom_axis(d3.boxplot.x_len);
    // d3.boxplot.draw_top_axis(d3.boxplot.x_zones);
    // d3.boxplot.draw_right_axis(d3.boxplot.y_zones);
    //
    // d3.selectAll("line.content-lines").remove();
    // d3.boxplot.draw_lines(d3.boxplot.lines, d3.boxplot.x_len, d3.boxplot.y_len);

    // $("#loading").show();
    // window.setTimeout(() => {
    //     d3.select("g.container").html(d3.boxplot.full_pict);
    //     $("#loading").hide();
    // }, 0);
};

d3.boxplot.draw_left_axis = function (y_max, y_min = 0) {
    let axis_length = 500;

    $(".axis-left").remove(); //Remove previous axis (if any)

    let svg_left = d3.boxplot.svgsupercontainer.append("svg:svg")
        .attr("class", "axis axis-left")
        .attr("width", 5)
        .attr("height", 90)
        .attr("x", 0)
        .attr("y", 5)
        .attr("viewBox", "0 0 20 " + axis_length)
        .attr("preserveAspectRatio", "none");

    let container_left = svg_left.append("g")
        .attr("width", axis_length)
        .attr("height", 20)
        .attr("transform", "translate(0," + axis_length + ")rotate(-90)");

    container_left.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", axis_length)
        .attr("height", 20)
        .style("fill", d3.boxplot.background_axis);

    container_left.append("line")
        .attr("x1", 0)
        .attr("x2", axis_length)
        .attr("y1", 20)
        .attr("y2", 20)
        .attr("stroke", "black");

    let y_size = y_max - y_min;

    for (let i = 1; i < 10; i++) {
        let y = axis_length / 10 * i;
        let y_t = y_min + y_size / 10 * i;
        if (y_t >= 0 && y_t <= d3.boxplot.y_len) {
            let y_lab = "";
            if (y_t > 1000000) {
                y_lab = (Math.round(y_t / 100000) / 10).toString() + " M";
            }
            else if (y_t > 1000) {
                y_lab = (Math.round(y_t / 100) / 10).toString() + " K";
            }
            else {
                y_lab = Math.round(y_t).toString();
            }
            container_left.append("line")
                .attr("x1", y)
                .attr("y1", 15)
                .attr("x2", y)
                .attr("y2", 20)
                .attr("stroke-width", axis_length / 800)
                .attr("stroke", "black");

            container_left.append("text")
                .attr("x", y)
                .attr("y", 12)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "7.5pt")
                .text(y_lab);
        }
    }
};

d3.boxplot.draw_bottom_axis = function (x_max, x_min = 0) {

    let axis_length = 500;

    $(".axis-bottom").remove(); //Remove previous axis (if any)

    let svg_bottom = d3.boxplot.svgsupercontainer.append("svg:svg")
        .attr("class", "axis axis-bottom")
        .attr("width", 90)
        .attr("height", 5)
        .attr("x", 5)
        .attr("y", 95)
        .attr("viewBox", "0 0 " + axis_length + " 20")
        .attr("preserveAspectRatio", "none");

    svg_bottom.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", axis_length)
        .attr("height", 20)
        .style("fill", d3.boxplot.background_axis);

    svg_bottom.append("line")
        .attr("x1", 0)
        .attr("x2", axis_length)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "black");

    let x_size = x_max - x_min;

    for (let i = 1; i < 10; i++) {
        let x = axis_length / 10 * i;
        let x_t = x_min + x_size / 10 * i;
        if (x_t >= 0 && x_t <= d3.boxplot.x_len) {
            let x_lab = "";
            if (x_t >= 1000000) {
                x_lab = (Math.round(x_t / 100000) / 10).toString() + " M";
            }
            else if (x_t >= 1000) {
                x_lab = (Math.round(x_t / 100) / 10).toString() + " K";
            }
            else {
                x_lab = Math.round(x_t).toString()
            }
            svg_bottom.append("line")
                .attr("x1", x)
                .attr("y1", 0)
                .attr("x2", x)
                .attr("y2", 5)
                .attr("stroke-width", d3.boxplot.scale / 800)
                .attr("stroke", "black");

            svg_bottom.append("text")
                .attr("x", x)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "7.5pt")
                .text(x_lab);
        }
    }
};

d3.boxplot.zoom_left_axis = function() {
    let transform = d3.boxplot.container.attr("transform");
    if (transform === null) {
        transform = "translate(0,0)scale(1)";
    }
    let tr_regex = /translate\(([^,]+),([^)]+)\)/;
    let translate = parseFloat(transform.match(tr_regex)[2]);
    let sc_regex = /scale\(([^,)]+)(,([^)]+))?\)/;
    let scale = parseFloat(transform.match(sc_regex)[3] !== undefined ? transform.match(sc_regex)[3] : transform.match(sc_regex)[1]);
    let max_y = d3.boxplot.y_len + translate / d3.boxplot.scale * d3.boxplot.y_len / scale;
    let min_y = max_y - d3.boxplot.y_len / scale;
    d3.boxplot.draw_left_axis(max_y, min_y);
};

d3.boxplot.zoom_bottom_axis = function() {
    let transform = d3.boxplot.container.attr("transform");
    if (transform === null) {
        transform = "translate(0,0)scale(1)";
    }
    let tr_regex = /translate\(([^,]+),([^)]+)\)/;
    let translate = parseFloat(transform.match(tr_regex)[1]);
    let sc_regex = /scale\(([^,)]+)(,([^)]+))?\)/;
    let scale = parseFloat(transform.match(sc_regex)[1]);

    let min_x = -translate / d3.boxplot.scale * d3.boxplot.x_len / scale;
    let max_x = (d3.boxplot.x_len - (translate / d3.boxplot.scale * d3.boxplot.x_len)) / scale;
    d3.boxplot.draw_bottom_axis(max_x, min_x);
};

d3.boxplot.draw_top_axis = function (x_zones=d3.boxplot.x_zones) {
    let transform = d3.boxplot.container.attr("transform");
    if (transform === null) {
        transform = "translate(0,0)scale(1)";
    }
    let tr_regex = /translate\(([^,]+),([^)]+)\)/;
    let translate = parseFloat(transform.match(tr_regex)[1]);
    let sc_regex = /scale\(([^,)]+)(,([^)]+))?\)/;
    let scale = parseFloat(transform.match(sc_regex)[1]);

    let axis_length = 500;
    let svg_top = d3.boxplot.svgsupercontainer.append("svg:svg")
        .attr("width", 90)
        .attr("height", 5)
        .attr("x", 5)
        .attr("y", 0)
        .attr("viewBox", "0 0 " + axis_length + " 20")
        .attr("preserveAspectRatio", "none");

    svg_top.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", axis_length)
        .attr("height", 20)
        .style("fill", d3.boxplot.background_axis);

    svg_top.append("line")
        .attr("x1", 0)
        .attr("x2", axis_length)
        .attr("y1", 20)
        .attr("y2", 20)
        .attr("stroke", "black");

    svg_top.append("text")
        .attr("x", axis_length / 2)
        .attr("y", 8)
        .attr("font-size", "8pt")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text(d3.boxplot.name_x);

    let nb_zone = 0;
    for (let zone in x_zones) {
        let x_pos_1 = Math.min(Math.max(x_zones[zone][0] * scale + translate, 0), d3.boxplot.scale);
        let x_pos_2 = Math.min(Math.max(x_zones[zone][1] * scale + translate, 0), d3.boxplot.scale);
        let z_len = x_pos_2 / d3.boxplot.scale * axis_length - x_pos_1 / d3.boxplot.scale * axis_length;
        if (z_len > 0.05 * axis_length) {
            //z_middle = (x_zones[zone][1] + x_zones[zone][0]) / 2
            let text_container = svg_top.append("svg:svg")
                .attr("x", x_pos_1 / d3.boxplot.scale * axis_length)
                .attr("y", 0)
                .attr("width", z_len)
                .attr("height", "100%");
            text_container.append("text")
                .attr("x", z_len / 2)
                .attr("y", 18)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "7pt")
                .text(zone);
        }
        if (nb_zone > 0) { //Draw zone separator at left of zone (except for first zone)
            svg_top.append("line")
                .attr("x1", x_pos_1 / d3.boxplot.scale * axis_length)
                .attr("x2", x_pos_1 / d3.boxplot.scale * axis_length)
                .attr("y1", "50%")
                .attr("y2", "100%")
                .attr("stroke", "black")
                .attr("stroke-width", 1);
        }
        nb_zone++;
    }
};

d3.boxplot.draw_right_axis = function (y_zones=d3.boxplot.y_zones) {
    let transform = d3.boxplot.container.attr("transform");
    if (transform === null) {
        transform = "translate(0,0)scale(1)";
    }
    let tr_regex = /translate\(([^,]+),([^)]+)\)/;
    let translate = parseFloat(transform.match(tr_regex)[2]);
    let sc_regex = /scale\(([^,)]+)(,([^)]+))?\)/;
    let scale = parseFloat(transform.match(sc_regex)[3] !== undefined ? transform.match(sc_regex)[3] : transform.match(sc_regex)[1]);

    let axis_length = 500;
    let svg_right = d3.boxplot.svgsupercontainer.append("svg:svg")
        .attr("width", 5)
        .attr("height", 90)
        .attr("x", 95)
        .attr("y", 5)
        .attr("viewBox", "0 0 20 " + axis_length)
        .attr("preserveAspectRatio", "none");

    let container_right = svg_right.append("g")
        .attr("width", axis_length)
        .attr("height", 20)
        .attr("transform", "translate(20)rotate(90)");

    container_right.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", axis_length)
        .attr("height", 20)
        .style("fill", d3.boxplot.background_axis);

    container_right.append("line")
        .attr("x1", 0)
        .attr("x2", axis_length)
        .attr("y1", 20)
        .attr("y2", 20)
        .attr("stroke", "black");

    container_right.append("text")
        .attr("x", axis_length / 2)
        .attr("y", 8)
        .attr("font-size", "8pt")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text(d3.boxplot.name_y);

    let nb_zone = Object.keys(y_zones).length - 1;
    for (let zone in y_zones) {
        let y_pos_2 = Math.min(Math.max((d3.boxplot.scale - y_zones[zone][0]) * scale + translate, 0), d3.boxplot.scale);
        let y_pos_1 = Math.min(Math.max((d3.boxplot.scale - y_zones[zone][1]) * scale + translate, 0), d3.boxplot.scale);
        let z_len = y_pos_2 / d3.boxplot.scale * axis_length - y_pos_1 / d3.boxplot.scale * axis_length;
        if (z_len > 0.05 * axis_length) {
            //z_middle = (x_zones[zone][1] + x_zones[zone][0]) / 2
            let text_container = container_right.append("svg:svg")
                .attr("x", y_pos_1 / d3.boxplot.scale * axis_length)
                .attr("y", 0)
                .attr("width", z_len)
                .attr("height", "100%");
            text_container.append("text")
                .attr("x", z_len / 2)
                .attr("y", 18)
                .attr("text-anchor", "middle")
                .attr("font-family", "sans-serif")
                .attr("font-size", "7pt")
                .text(zone);
        }
        if (nb_zone > 0) { //Draw zone separator at left of zone (except for first zone)
            container_right.append("line")
                .attr("x1", y_pos_1 / d3.boxplot.scale * axis_length)
                .attr("x2", y_pos_1 / d3.boxplot.scale * axis_length)
                .attr("y1", 10)
                .attr("y2", 20)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("class", "whereis");
        }
        nb_zone--;
    }
};

d3.boxplot._sort_color_idy = function(a, b) {
    return parseFloat(b) - parseFloat(a);
};

d3.boxplot.draw_legend = function () {
    d3.select("#legend .draw").html(""); //Empty legend
    let color_idy = d3.boxplot.color_idy;
    let color_idy_len = Object.keys(color_idy).length;
    let color_idy_order = ["pos+", "pos-", "neg+", "neg-"];
    let color_idy_labels = [d3.boxplot.limit_idy.toString(), "0", (-d3.boxplot.limit_idy).toString(), "-1"];
    let svgcontainer = d3.select("#legend .draw").append("svg:svg")
        .attr("width", "100%")
        .attr("height", "99%");
    let draw = $("#legend").find(".draw");
    let draw_w = draw.width();
    let draw_h = draw.height();
    let container = svgcontainer.append("g");
    for (let i = 0; i < color_idy_order.length; i++) {
        let color_idy_idx = color_idy_order[i];
        container.append("rect")
            .attr("x", "50%")
            .attr("y", (i * (100 / color_idy_len)) + "%")
            .attr("width", "50%")
            .attr("height", (100 / color_idy_len) + "%")
            .attr("stroke", "none")
            .attr("fill", color_idy[color_idy_idx]);
        container.append("text")
            .attr("x", "45%")
            .attr("y", ((i * (100 / color_idy_len)) + (100 / color_idy_len)-1) + "%")
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", "10pt")
            .text(color_idy_labels[i]);
    }
    container.append("text")
            .attr("x", "45%")
            .attr("y", 10)
            .attr("text-anchor", "end")
            .attr("font-family", "sans-serif")
            .attr("font-size", "10pt")
            .text("1");
    container.append("text")
        .attr("x", 0)
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("transform", "translate(-" + (draw_w - 15) + "," + (draw_h / 2) + ")rotate(-90)")
        .attr("font-family", "sans-serif")
        .attr("font-size", "11.5pt")
        .attr("font-weight", "bold")
        .text("Identity")

};

d3.boxplot.click = function () {
    if (!d3.event.ctrlKey) {
        $("#loading").show();
        let event = d3.event;
        window.setTimeout(() => {
            let rect = $("g.container")[0].getBoundingClientRect();
            let posX = rect.left,
                posY = rect.top,
                width_c = rect.width,
                height_c = rect.height;
            let x = (event.pageX - posX) / width_c * d3.boxplot.scale,
                y = d3.boxplot.scale - (event.pageY - posY) / height_c * d3.boxplot.scale;
            d3.boxplot.select_zone(x, y);
            $("#restore-all").show();
            $("#loading").hide();
        }, 0);
    }
};

d3.boxplot.mousedown = function() {
    if (d3.boxplot.zoom_enabled) {
        let rect = $("g.container")[0].getBoundingClientRect();
        let posX = rect.left,
            posY = rect.top,
            width_c = rect.width,
            height_c = rect.height;
        let cursor_x = (d3.event.pageX - posX) / width_c * d3.boxplot.scale,
            cursor_y = (d3.event.pageY - posY) / height_c * d3.boxplot.scale;
        d3.boxplot.translate_start = [cursor_x, cursor_y];
        d3.boxplot.posX = posX;
        d3.boxplot.posY = posY;
        let old_transform = d3.boxplot.container.attr("transform");
        d3.boxplot.old_translate = [0, 0];
        if (old_transform !== null) {
            let search_tr = old_transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
            d3.boxplot.old_translate = [parseFloat(search_tr[1]), parseFloat(search_tr[2])];
        }
    }
};

d3.boxplot.mouseup = function() {
    d3.boxplot.translate_start = null;
};

d3.boxplot.translate = function () {
    let rect = $("g.container")[0].getBoundingClientRect();
    let posX = d3.boxplot.posX,
        posY = d3.boxplot.posY,
        width_c = rect.width,
        height_c = rect.height;
    let cursor_x = (d3.event.pageX - posX) / width_c * d3.boxplot.scale,
        cursor_y = (d3.event.pageY - posY) / height_c * d3.boxplot.scale;
    if (d3.boxplot.translate_start !== null && d3.event.ctrlKey) {
        let old_transform = d3.boxplot.container.attr("transform");
        //let scale = 1;
        let scale_x = 1;
        let scale_y = 1;
        if (old_transform) {
            let scale = old_transform.match(/scale\(([-\d.]+)(,\s*([-\d.]+))?\)/);
            scale_x = scale[1];
            scale_y = scale[1];
            if (scale[3] !== undefined)
                scale_y = scale[3];
        }
        let translate = [d3.boxplot.old_translate[0] + (cursor_x - d3.boxplot.translate_start[0]) * scale_x,
                         d3.boxplot.old_translate[1] + (cursor_y - d3.boxplot.translate_start[1]) * scale_y];
        let min_tr = [d3.boxplot.scale - 0.2 * d3.boxplot.scale, d3.boxplot.scale - 0.2 * d3.boxplot.scale];
        let max_tr = [-d3.boxplot.scale * scale_x + 200, -d3.boxplot.scale * scale_x + 200];
        if (translate[0] < max_tr[0]) {
            translate[0] = max_tr[0];
        }
        else if (translate[0] > min_tr[0]) {
            translate[0] = min_tr[0];
        }
        if (translate[1] < max_tr[1]) {
            translate[1] = max_tr[1];
        }
        else if (translate[1] > min_tr[1]) {
            translate[1] = min_tr[1];
        }
        let new_transform = `translate(${translate[0]}, ${translate[1]}) scale(${scale_x}, ${scale_y})`;
        d3.boxplot.container.attr("transform", new_transform);

        //Update axis:
        d3.boxplot.draw_top_axis();
        d3.boxplot.draw_right_axis();
        d3.boxplot.zoom_bottom_axis();
        d3.boxplot.zoom_left_axis();
    }
};

// d3.boxplot.zoom = function () {
//     console.log(d3.event);
//     if (d3.event.ctrlKey) {
//         d3.event.preventDefault();
//         let rect = $("g.container")[0].getBoundingClientRect();
//         let posX = rect.left,
//             posY = rect.top,
//             width_c = rect.width,
//             height_c = rect.height;
//         let cursor_x = (d3.event.pageX - posX) / width_c * d3.boxplot.x_len,
//             cursor_y = (d3.event.pageY - posY) / height_c * d3.boxplot.y_len;
//         console.log(cursor_x, cursor_y);
//         let zoom_f = 1.2;
//         let old_transform = d3.boxplot.container.attr("transform")
//         if (old_transform !== null) {
//             let search_tr = old_transform.match(/translate\(([-\de.]+),([-\de.]+)\)/);
//             let search_sc = old_transform.match(/scale\(([-\de.]+)(,[-\de.]+)?\)/);
//             old_transform = {
//                 "scale": parseFloat(search_sc[1]),
//                 "translate": [parseFloat(search_tr[1]), parseFloat(search_tr[2])]
//             }
//         }
//         else {
//             old_transform = {
//                 "scale": 1,
//                 "translate": [0, 0]
//             }
//         }
//         console.log(old_transform);
//
//         //Cursor localisation on picture with old zoom:
//         let cursor_old = [(cursor_x - old_transform["translate"][0]), (cursor_y - old_transform["translate"][1])]; //x0,y0 bleu (visible)
//         console.log([(cursor_x - old_transform["translate"][0]), (cursor_y - old_transform["translate"][1])]);
//         console.log("c_old", cursor_old);
//         let new_scale,
//             cursor_new;
//         if (d3.event.deltaY < 0) {
//             new_scale = old_transform["scale"] * zoom_f;
//             cursor_new = [cursor_old[0] * zoom_f, cursor_old[1] * zoom_f];
//         }
//         else {
//             new_scale = old_transform["scale"] / zoom_f;
//             if (new_scale < 1) {
//                 new_scale = 1;
//                 zoom_f = old_transform["scale"] / new_scale;
//             }
//             cursor_new = [cursor_old[0] / zoom_f, cursor_old[1] / zoom_f];
//         }
//
//         let new_transform = vsprintf("translate(%f,%f) scale(%f)",
//             [old_transform["translate"][0] - (cursor_new[0] - cursor_old[0]),
//              old_transform["translate"][1] - (cursor_new[1] - cursor_old[1]),
//              new_scale]);
//         d3.boxplot.container.attr("transform", new_transform);
//
//         //Correct lines stroke width to be not impacted by the zoom:
//         d3.selectAll("line.content-lines").attr("stroke-width", (d3.boxplot.x_len / 400) / new_scale);
//     }
// };

d3.boxplot.zoom = function () {
    if (d3.event.ctrlKey) {
        d3.event.preventDefault();
        if (d3.boxplot.zoom_enabled) {
            let zoom_f = 1.2;
            let old_transform = d3.boxplot.container.attr("transform");
            if (old_transform !== null) {
                let search_tr = old_transform.match(/translate\(([-\de.]+),\s*([-\de.]+)\)/);
                let search_sc = old_transform.match(/scale\(([-\de.]+)(,\s*[-\de.]+)?\)/);
                old_transform = {
                    "scale": parseFloat(search_sc[1]),
                    "translate": [parseFloat(search_tr[1]), parseFloat(search_tr[2])]
                }
            }
            else {
                old_transform = {
                    "scale": 1,
                    "translate": [0, 0]
                }
            }
            let new_scale;
            if (d3.event.deltaY < 0) {
                new_scale = old_transform["scale"] * zoom_f;
            }
            else {
                new_scale = old_transform["scale"] / zoom_f;
                if (new_scale < 1) {
                    new_scale = 1;
                }
            }
            let new_transform = `translate(${old_transform["translate"][0]},${old_transform["translate"][1]}) 
            scale(${new_scale})`;
            d3.boxplot.container.attr("transform", new_transform);

            //Correct lines stroke width to be not impacted by the zoom:
            d3.selectAll("path.content-lines").attr("stroke-width", d3.boxplot.content_lines_width / new_scale);
            d3.selectAll("line.break-lines").attr("stroke-width", d3.boxplot.break_lines_width / new_scale);

            //Update axis:
            d3.boxplot.draw_top_axis();
            d3.boxplot.draw_right_axis();
            d3.boxplot.zoom_bottom_axis();
            d3.boxplot.zoom_left_axis();
        }
    }
};

d3.boxplot._get_line_len = function (line) {
    let x1 = line[0] / d3.boxplot.x_len * d3.boxplot.scale;
    let x2 = line[1] / d3.boxplot.x_len * d3.boxplot.scale;
    let y1 = d3.boxplot.scale - (line[2] / d3.boxplot.y_len * d3.boxplot.scale);
    let y2 = d3.boxplot.scale - (line[3] / d3.boxplot.y_len * d3.boxplot.scale);
    return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
};

d3.boxplot._sort_lines = function(l1, l2) {
    return d3.boxplot._get_line_len(l2) - d3.boxplot._get_line_len(l1);
};

d3.boxplot._sort_lines_by_idy = function(l1, l2) {
    return l1[4] - l2[4];
};

d3.boxplot.draw_lines = function (lines=d3.boxplot.lines, x_len=d3.boxplot.x_len, y_len=d3.boxplot.y_len) {

    // let tmp_max = d3.boxplot.max_idy - d3.boxplot.min_idy;
    //
    // let nb_lines = 0;
    // for (let i = 0; i < lines.length; i++) {
    //     nb_lines++;
    //     if (nb_lines > 50000) {
    //         break;
    //     }
    //     let line = lines[i];
    //     let x1 = line[0] / x_len * d3.boxplot.scale;
    //     let x2 = line[1] / x_len * d3.boxplot.scale;
    //     let y1 = d3.boxplot.scale - (line[2] / y_len * d3.boxplot.scale);
    //     let y2 = d3.boxplot.scale - (line[3] / y_len * d3.boxplot.scale);
    //     let line_len = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    //     let color = "#000";
    //     for (let part in color_idy) {
    //         if (line[4] >= part) {
    //             color = color_idy[part];
    //         }
    //     }
    //     d3.boxplot.container.append("line")
    //         .attr("x1", x1)
    //         .attr("y1", y1)
    //         .attr("x2", x2)
    //         .attr("y2", y2)
    //         .attr("class", "content-lines")
    //         .attr("stroke-width", d3.boxplot.scale / 400)
    //         .attr("stroke", line_len >= 1 ? color : "black");
    // }

    //Remove old lines (if any):
    $("path.content-lines").remove();

    let lineFunction = function(d, min_size=0, max_size=null) {
        d = d.sort(d3.boxplot._sort_lines_by_idy);
        let path = [];
        for (let i=0; i < d.length; i++) {
            let d_i = d[i];
            let x1 = d_i[0] / x_len * d3.boxplot.scale;
            let x2 = d_i[1] / x_len * d3.boxplot.scale;
            let y1 = d3.boxplot.scale - (d_i[2] / y_len * d3.boxplot.scale);
            let y2 = d3.boxplot.scale - (d_i[3] / y_len * d3.boxplot.scale);
            let idy = d_i[4];
            let len = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            if (len > min_size && (max_size === null || len < max_size) && Math.abs(idy) >= d3.boxplot.min_idy_draw) {
                path.push(`M${x1} ${y1} L${x2} ${y2}`);
            }
        }
        return path.join(" ")
    };

    //lines = lines.sort(d3.boxplot._sort_lines);
    let min_sizes = d3.boxplot.min_sizes;
    for (let i=0; i<min_sizes.length; i++) {
        let min_size = min_sizes[i];
        let max_size = i + 1 < min_sizes.length ? min_sizes[i + 1] : null;
        if (lines["pos-"].length > 0) {
            d3.boxplot.container.append("path")
                .attr("d", lineFunction(lines["pos-"], min_size, max_size))
                .attr("class", "content-lines s_" + min_size.toString().replace(".", "_"))
                .attr("stroke-width", d3.boxplot.content_lines_width + "px")
                .attr("stroke", d3.boxplot.color_idy["pos-"])
                .attr("stroke-linecap", d3.boxplot.linecap);
        }
        if (lines["neg+"].length > 0) {
            d3.boxplot.container.append("path")
                .attr("d", lineFunction(lines["neg+"], min_size, max_size))
                .attr("class", "content-lines s_" + min_size.toString().replace(".", "_"))
                .attr("stroke-width", d3.boxplot.content_lines_width + "px")
                .attr("stroke", d3.boxplot.color_idy["neg+"])
                .attr("stroke-linecap", d3.boxplot.linecap);
        }
    }
    //Draw better quality at the end (to be shown up)
    for (let i=0; i<min_sizes.length; i++) {
        let min_size = min_sizes[i];
        let max_size = i + 1 < min_sizes.length ? min_sizes[i + 1] : null;
        if (lines["pos+"].length > 0) {
            d3.boxplot.container.append("path")
                .attr("d", lineFunction(lines["pos+"], min_size, max_size))
                .attr("class", "content-lines s_" + min_size.toString().replace(".", "_"))
                .attr("stroke-width", d3.boxplot.content_lines_width + "px")
                .attr("stroke", d3.boxplot.color_idy["pos+"])
                .attr("stroke-linecap", d3.boxplot.linecap);
        }
        if (lines["neg-"].length > 0) {
            d3.boxplot.container.append("path")
                .attr("d", lineFunction(lines["neg-"], min_size, max_size))
                .attr("class", "content-lines s_" + min_size.toString().replace(".", "_"))
                .attr("stroke-width", d3.boxplot.content_lines_width + "px")
                .attr("stroke", d3.boxplot.color_idy["neg-"])
                .attr("stroke-linecap", d3.boxplot.linecap);
        }
    }
};

d3.boxplot.draw = function (x_contigs, x_order, y_contigs, y_order) {
    let width = 850;
    let height = 850;
    $("div#draw").width(width)
        .height(height);
    let draw = $("#draw");
    draw.empty();
    draw.append($("<div>")
        .attr("id", "restore-all").css("display", "none"));
    d3.boxplot.svgsupercontainer = d3.select("#draw").append("svg:svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", "0 0 100 100")
        .attr("preserveAspectRatio", "none")
        .on("mousewheel", d3.boxplot.zoom);
    let drawcontainer = d3.boxplot.svgsupercontainer.append("svg:g")
        .on("mousedown", d3.boxplot.mousedown)
        .on("mouseup", d3.boxplot.mouseup)
        .on("mousemove", d3.boxplot.translate);
    drawcontainer.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("stroke", "none")
        .attr("fill", "white");
    d3.boxplot.svgcontainer = drawcontainer.append("svg:svg")
        .attr("class", "svgcontainer")
        .attr("width", 90)
        .attr("height", 90)
        .attr("x", 5)
        .attr("y", 5)
        .attr("viewBox", "0 0 " + d3.boxplot.scale + " " + d3.boxplot.scale)
        .attr("preserveAspectRatio", "none")
        .on("click", d3.boxplot.click);

    d3.boxplot.container = d3.boxplot.svgcontainer.append("svg:g")
        .attr("class", "container");

    d3.boxplot.container.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("stroke", "none")
        .attr("fill", "white");

    //X axis:
    d3.boxplot.x_zones = {};
    let sum = 0;
    for (let i = 0; i < x_order.length - 1; i++) {
        let x_id = x_order[i];
        let x_contig_len = x_contigs[x_id] / d3.boxplot.x_len * d3.boxplot.scale;
        d3.boxplot.x_zones[x_id] = [sum, sum + x_contig_len];
        sum += x_contig_len;

        d3.boxplot.container.append("line")
            .attr("x1", sum)
            .attr("y1", d3.boxplot.scale)
            .attr("x2", sum)
            .attr("y2", 0)
            .attr("class", "break-lines")
            .attr("stroke-width", d3.boxplot.break_lines_width)
            .attr("stroke", d3.boxplot.break_lines_color)
            .style("stroke-dasharray", ("3, 3"));
    }
    d3.boxplot.x_zones[x_order[x_order.length - 1]] = [sum, d3.boxplot.scale];

    //Y axis:
    d3.boxplot.y_zones = {};
    sum = 0;
    for (let i = 0; i < y_order.length - 1; i++) {
        let y_id = y_order[i];
        let y_contig_len = y_contigs[y_id] / d3.boxplot.y_len * d3.boxplot.scale;
        d3.boxplot.y_zones[y_id] = [sum, sum + y_contig_len];
        sum += y_contig_len;

        d3.boxplot.container.append("line")
            .attr("x1", 0)
            .attr("y1", d3.boxplot.scale - sum)
            .attr("x2", d3.boxplot.scale)
            .attr("y2", d3.boxplot.scale - sum)
            .attr("class", "break-lines")
            .attr("stroke-width", d3.boxplot.break_lines_width)
            .attr("stroke", d3.boxplot.break_lines_color)
            .style("stroke-dasharray", ("3, 3"));
    }
    d3.boxplot.y_zones[y_order[y_order.length - 1]] = [sum, d3.boxplot.scale];

    d3.boxplot.draw_left_axis(d3.boxplot.y_len);
    d3.boxplot.draw_bottom_axis(d3.boxplot.x_len);
    d3.boxplot.draw_top_axis(d3.boxplot.x_zones);
    d3.boxplot.draw_right_axis(d3.boxplot.y_zones);

    window.setTimeout(() => {
        //Data:
        d3.boxplot.draw_lines();

        $("#restore-all").click(function () {
            d3.boxplot.reset_scale();
            $(this).hide();
        });

        $(document).on("keyup", function(e) {
            if (e.keyCode === 27) {
                d3.boxplot.reset_scale();
                $("#restore-all").hide();
            }
        });

        d3.boxplot.draw_legend();

        $("#loading").hide();
    }, 0);
};
