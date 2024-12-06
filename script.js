fetch("https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json")
  .then(response => response.json())
  .then(data => drawHeatmap(data));

function drawHeatmap({ baseTemperature, monthlyVariance }) {
  const containerWidth = document.getElementById("heatmap").clientWidth;
  const containerHeight = document.getElementById("heatmap").clientHeight;

  const margin = { top: 50, right: 50, bottom: 100, left: 100 };
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  const svg = d3
    .select("#heatmap")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const years = [...new Set(monthlyVariance.map(d => d.year))];
  const months = [...Array(12).keys()];

  const xScale = d3
    .scaleBand()
    .domain(years)
    .range([0, width]);

  const yScale = d3
    .scaleBand()
    .domain(months)
    .range([0, height]);

  const colorScale = d3
    .scaleSequential()
    .interpolator(d3.interpolateRdBu)
    .domain([
      d3.max(monthlyVariance, d => baseTemperature + d.variance),
      d3.min(monthlyVariance, d => baseTemperature + d.variance)
    ]);

  const xAxis = d3.axisBottom(xScale).tickValues(
    xScale.domain().filter(year => year % 10 === 0)
  );

  const yAxis = d3.axisLeft(yScale).tickFormat(month => {
    const date = new Date(0, month);
    return d3.timeFormat("%B")(date);
  });

  svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  svg.append("g")
    .attr("id", "y-axis")
    .call(yAxis);

  svg.selectAll(".cell")
    .data(monthlyVariance)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("data-year", d => d.year)
    .attr("data-month", d => d.month - 1)
    .attr("data-temp", d => baseTemperature + d.variance)
    .attr("x", d => xScale(d.year))
    .attr("y", d => yScale(d.month - 1))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", d => colorScale(baseTemperature + d.variance))
    .on("mouseover", function (event, d) {
      d3.select(this).style("stroke", "black").style("stroke-width", "2px");
      const tooltip = d3.select("#tooltip");
      const monthName = d3.timeFormat("%B")(new Date(0, d.month - 1));
      const temp = (baseTemperature + d.variance).toFixed(2);

      tooltip
        .style("opacity", 1)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`)
        .attr("data-year", d.year)
        .html(`
          <strong>Year:</strong> ${d.year}<br>
          <strong>Month:</strong> ${monthName}<br>
          <strong>Temp:</strong> ${temp}°C<br>
          <strong>Variance:</strong> ${d.variance.toFixed(2)}°C
        `);
    })
    .on("mouseout", function () {
      d3.select(this).style("stroke", "none"); // Remove border on mouseout
      d3.select("#tooltip").style("opacity", 0);
    });

  const legendWidth = Math.min(400, width);
  const legendHeight = 20;

  const legendX = d3
    .scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendX).ticks(5);

  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(0, ${height + 40})`);

  legend
    .selectAll("rect")
    .data(colorScale.ticks(10).slice(0, -1))
    .enter()
    .append("rect")
    .attr("x", d => legendX(d))
    .attr("y", 0)
    .attr("width", legendWidth / 10)
    .attr("height", legendHeight)
    .attr("fill", d => colorScale(d));

  legend.append("g").attr("transform", `translate(0, ${legendHeight})`).call(legendAxis);
}
