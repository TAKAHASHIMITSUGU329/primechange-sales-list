const csvPath = "primechange_hotel_cleaning_sales_list.csv";
const state = {
  rows: [],
  priority: "all",
  query: "",
};

const fields = {
  priority: "優先度",
  company: "営業先",
  brand: "主なブランド・施設",
  area: "主なエリア",
  department: "狙う部署・担当",
  hypothesis: "営業仮説",
  proposal: "提案切り口",
  action: "初回アクション",
  url: "公式URL",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...data] = rows;
  return data.map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index] || ""])));
}

function priorityClass(priority) {
  return `priority priority-${priority.toLowerCase()}`;
}

function matches(row) {
  const priorityMatch = state.priority === "all" || row[fields.priority] === state.priority;
  const target = Object.values(row).join(" ").toLowerCase();
  const queryMatch = target.includes(state.query.toLowerCase());
  return priorityMatch && queryMatch;
}

function filteredRows() {
  return state.rows.filter(matches);
}

function renderSummary() {
  document.getElementById("totalCount").textContent = state.rows.length;
  document.getElementById("priorityACount").textContent = state.rows.filter((row) => row[fields.priority] === "A").length;
}

function renderTopTargets() {
  const topTargets = state.rows
    .filter((row) => row[fields.priority] === "A")
    .slice(0, 10);
  document.getElementById("topTargets").innerHTML = topTargets
    .map((row) => `<li>${row[fields.company]}</li>`)
    .join("");
}

function renderCards(rows) {
  document.getElementById("visibleCount").textContent = rows.length;
  document.getElementById("cards").innerHTML = rows
    .map((row) => `
      <article class="card">
        <div class="card-head">
          <div>
            <h3>${row[fields.company]}</h3>
            <div class="meta">
              <p>${row[fields.brand]}</p>
              <p>${row[fields.area]}</p>
            </div>
          </div>
          <span class="${priorityClass(row[fields.priority])}">${row[fields.priority]}</span>
        </div>
        <div class="block">
          <strong>狙う部署</strong>
          <p>${row[fields.department]}</p>
        </div>
        <div class="block">
          <strong>営業仮説</strong>
          <p>${row[fields.hypothesis]}</p>
        </div>
        <div class="block">
          <strong>提案切り口</strong>
          <p>${row[fields.proposal]}</p>
        </div>
        <div class="block">
          <strong>初回アクション</strong>
          <p>${row[fields.action]}</p>
        </div>
        <a href="${row[fields.url]}" target="_blank" rel="noopener">公式サイトを見る</a>
      </article>
    `)
    .join("");
}

function renderTable(rows) {
  document.getElementById("salesTable").innerHTML = rows
    .map((row) => `
      <tr>
        <td><span class="${priorityClass(row[fields.priority])}">${row[fields.priority]}</span></td>
        <td><strong>${row[fields.company]}</strong></td>
        <td>${row[fields.brand]}</td>
        <td>${row[fields.area]}</td>
        <td>${row[fields.department]}</td>
        <td>${row[fields.proposal]}</td>
        <td>${row[fields.action]}</td>
        <td><a href="${row[fields.url]}" target="_blank" rel="noopener">Link</a></td>
      </tr>
    `)
    .join("");
}

function render() {
  const rows = filteredRows();
  renderCards(rows);
  renderTable(rows);
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    state.priority = button.dataset.priority;
    render();
  });
});

document.getElementById("searchInput").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  render();
});

fetch(csvPath)
  .then((response) => {
    if (!response.ok) throw new Error("CSVを読み込めませんでした");
    return response.text();
  })
  .then((text) => {
    state.rows = parseCsv(text);
    renderSummary();
    renderTopTargets();
    render();
  })
  .catch((error) => {
    document.getElementById("cards").innerHTML = `<p class="error">${error.message}</p>`;
  });
