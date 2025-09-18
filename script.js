(() => {
  "use strict";

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const formatValue = (value, precision) => {
    const factor = Math.pow(10, precision);
    return (Math.round(value * factor) / factor).toFixed(precision);
  };

  const updateIndicator = (indicator, indicatorLength, progressStep) => {
    if (!indicator) {
      return;
    }

    indicator.style.opacity = 1;

    if (!indicatorLength) {
      return;
    }

    const normalized = clamp(Number(progressStep) || 0, 0, 1);
    const dashOffset = indicatorLength * (1 - normalized);

    requestAnimationFrame(() => {
      indicator.style.strokeDashoffset = dashOffset;
    });
  };

  const accelerateMetric = (metric, indicator, indicatorLength, index, total) => {
    return new Promise((resolve) => {
      const valueElement = metric.querySelector(".metric__value");
      if (!valueElement) {
        resolve();
        return;
      }

      const targetValue = parseFloat(valueElement.dataset.value || "0");
      const precision = parseInt(valueElement.dataset.precision || "0", 10);
      const duration = 1200;
      const cooldown = 220;

      metric.classList.add("metric--active");
      metric.classList.remove("metric--complete");

      const progressStep = metric.dataset.progress || ((index + 1) / total);
      updateIndicator(indicator, indicatorLength, progressStep);

      const start = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const linear = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(linear);
        const currentValue = targetValue * eased;

        valueElement.textContent = formatValue(currentValue, precision);
        valueElement.style.setProperty("--metric-progress", eased.toString());

        if (linear < 1) {
          requestAnimationFrame(step);
          return;
        }

        valueElement.textContent = formatValue(targetValue, precision);
        valueElement.style.setProperty("--metric-progress", "1");
        metric.classList.remove("metric--active");
        metric.classList.add("metric--complete");
        setTimeout(resolve, cooldown);
      };

      requestAnimationFrame(step);
    });
  };

  window.addEventListener("DOMContentLoaded", async () => {
    if (document.body.classList.contains("no-js")) {
      document.body.classList.remove("no-js");
    }

    const metrics = Array.from(document.querySelectorAll(".metric"));
    if (!metrics.length) {
      return;
    }

    const indicator = document.querySelector(".dial__speed-indicator");
    let indicatorLength = 0;

    if (indicator) {
      try {
        indicatorLength = indicator.getTotalLength();
      } catch (error) {
        indicatorLength = 0;
      }

      if (indicatorLength > 0) {
        indicator.style.strokeDasharray = indicatorLength;
        indicator.style.strokeDashoffset = indicatorLength;
      } else {
        indicator.style.strokeDasharray = "100";
        indicator.style.strokeDashoffset = "100";
      }
    }

    metrics.forEach((metric) => {
      metric.classList.remove("metric--active", "metric--complete");
      const valueElement = metric.querySelector(".metric__value");
      if (!valueElement) {
        return;
      }
      const precision = parseInt(valueElement.dataset.precision || "0", 10);
      valueElement.textContent = formatValue(0, precision);
      valueElement.style.setProperty("--metric-progress", "0");
    });

    await wait(320);

    try {
      await metrics.reduce((sequence, metric, index) => {
        return sequence.then(() => accelerateMetric(metric, indicator, indicatorLength, index, metrics.length));
      }, Promise.resolve());
    } catch (error) {
      console.error(error);
    }
  });
})();
