document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".tab-buttons button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-tab");

      // Toggle active class on buttons
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // Show only the selected tab content
      tabContents.forEach(tab => {
        tab.classList.toggle("active", tab.id === targetId);
      });
    });
  });
});

