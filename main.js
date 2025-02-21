const resultsSection = document.querySelector(".searchResults");
const loadingScreen = document.querySelector(".loadingScreen");
const firstPageNum = document.querySelector(".firstPage");
const lastPageNum = document.querySelector(".lastPage");
const nextPageBtn = document.querySelector("#fw");
const prevPageBtn = document.querySelector("#bw");
const submitBtn = document.querySelector("#searchBtn");
const searchText = document.querySelector("#searchText");
const popup = document.querySelector(".popup");
const personajesHeader = document.querySelector(".searchResultsHeader");
const pagesIndicator = document.querySelector("#pages");
const baseLink = "https://rickandmortyapi.com/api/character/?";
const genderFilters = document.querySelector(".gender");
const statusFilters = document.querySelector(".status");

let appState = {
  fetchUrl: "https://rickandmortyapi.com/api/character/?",
  currentPage: 1,
  nameFilter: { active: false, name: null },
  statusFilter: { active: false, status: null },
  genderFilter: { active: false, gender: null },
  nextPage: null,
  prevPage: null,
  totalPages: 0,
  prevFilters: {
    nameFilter: { active: false, name: null },
    statusFilter: { active: false, status: null },
    genderFilter: { active: false, gender: null },
  },
  hadResults: null,
  isFirstSearch: true,
};

async function fetchData(url) {
  loadingScreen.classList.remove("hide");
  resultsSection.classList.add("hide");
  try {
    let data = await fetch(url);
    let trueData = await data.json();
    if (!trueData.error) {
      appState.nextPage = trueData.info.next;
      appState.prevPage = trueData.info.prev;
      appState.totalPages = trueData.info.pages;
      appState.hadResults = true;
    } else {
      appState.hadResults = false;
    }
    return trueData;
  } catch (e) {
    resultsSection.innerHTML =
      "Error al traer los datos de la API: " + String(e);
    return null;
  } finally {
    //tiempo de carga forzado para apreciar la animacion, la realidad es que carga mucho mas rapido que 1s
    if (!appState.hadResults) loadingScreen.classList.add("hide");
    else {
      setTimeout(() => {
        loadingScreen.classList.add("hide");
        resultsSection.classList.remove("hide");
      }, 1000);
    }
  }
}

async function fetchAndRender() {
  let data = await fetchData(appState.fetchUrl);
  if (data === null) return;
  if (!appState.hadResults) {
    personajesHeader.classList.add("hide");
    pagesIndicator.style.display = "none";
    resultsSection.classList.add("hide");
    showPopUpMessage("No se encontraron resultados para tu busqueda 😥.");
    updateFiltersHist();
    return;
  } else {
    personajesHeader.classList.remove("hide");
    pagesIndicator.style.display = "flex";
  }
  resultsSection.innerHTML = data.results
    .map((data) => {
      return createCardTemplate(data);
    })
    .join("");
  if (!appState.isFirstSearch) {
    setTimeout(() => {
      personajesHeader.scrollIntoView({ behavior: "smooth" });
    }, 1000);
  } else appState.isFirstSearch = false;
  updatePageProgress();
  updateFiltersHist();
}

function updateFiltersHist() {
  appState.prevFilters.genderFilter = { ...appState.genderFilter };
  appState.prevFilters.nameFilter = { ...appState.nameFilter };
  appState.prevFilters.statusFilter = { ...appState.statusFilter };
}
function updateLinkFilters() {
  let nameFilter = String(searchText.value);
  if (appState.genderFilter.active)
    appState.fetchUrl += "&gender=" + String(appState.genderFilter.gender);
  if (appState.statusFilter.active)
    appState.fetchUrl += "&status=" + String(appState.statusFilter.status);
  if (nameFilter !== "" && nameFilter !== "null") {
    appState.nameFilter.name = nameFilter;
    appState.nameFilter.active = true;
    appState.fetchUrl += "&name=" + appState.nameFilter.name;
  } else {
    appState.nameFilter.active = false;
    appState.nameFilter.name = null;
  }
}

function updatePageProgress() {
  firstPageNum.textContent = appState.currentPage;
  lastPageNum.textContent = appState.totalPages;
  if (appState.nextPage === null) nextPageBtn.style.display = "none";
  else nextPageBtn.style.display = "flex";
  if (appState.prevPage === null) {
    prevPageBtn.style.display = "none";
  } else prevPageBtn.style.display = "flex";
}
function createCardTemplate(pj) {
  let { name, species, gender, origin, status, image } = pj;
  return `<div class="pjCard">
          <h3 class="pjName">${name}</h3>
          <img src="${image}" alt="${name}" class="pjImage" />
          <ul class="pjInformationList">
            <li class="pjInformation">Species: ${species}</li>
            <li class="pjInformation">Gender: ${gender}</li>
            <li class="pjInformation">Origin: ${origin.name}</li>
            <li class="pjInformation">Status: ${status}</li>
          </ul>
        </div>`;
}

async function nextAndPrevPageHandler(event) {
  if (event.target.id === "fw") {
    appState.fetchUrl = appState.nextPage;
    appState.currentPage++;
  } else {
    appState.fetchUrl = appState.prevPage;
    appState.currentPage--;
  }
  blockNextAndPrev();
  await fetchAndRender();
  unblockNextAndPrev();
}

function blockNextAndPrev() {
  nextPageBtn.style.pointerEvents = "none";
  nextPageBtn.style.opacity = "0.5";
  prevPageBtn.style.pointerEvents = "none";
  prevPageBtn.style.opacity = "0.5";
}

function unblockNextAndPrev() {
  nextPageBtn.style.pointerEvents = "auto";
  nextPageBtn.style.opacity = "1";
  prevPageBtn.style.pointerEvents = "auto";
  prevPageBtn.style.opacity = "1";
}

function submitHandler(event) {
  event.preventDefault();
  resetPageCounter();
  resetBaseLink();
  updateLinkFilters();
  if (!somethingChanged()) {
    //con esto nos ahorramos enviar una solicitud a la api si es que nada cambio.
    showPopUpMessage("Nota: Nada ha cambiado en tu busqueda...");
    setTimeout(() => {
      personajesHeader.scrollIntoView({ behavior: "smooth" });
    }, 250);
    return;
  }
  fetchAndRender();
}

function resetPageCounter() {
  appState.currentPage = 1;
}
function resetBaseLink() {
  appState.fetchUrl = baseLink;
}
function showPopUpMessage(message) {
  popup.textContent = message;
  popup.classList.remove("hideVis");
  popup.classList.add("showVis");
  setTimeout(() => {
    popup.classList.remove("showVis");
    popup.classList.add("hideVis");
  }, 2000);
}
function somethingChanged() {
  return (
    appState.nameFilter.name !== appState.prevFilters.nameFilter.name ||
    appState.genderFilter.gender !== appState.prevFilters.genderFilter.gender ||
    appState.statusFilter.status !== appState.prevFilters.statusFilter.status
  );
}

function handleGender(event) {
  let genders;
  if (!event.target.classList.contains("genderfilter")) return;
  genders = document.querySelectorAll(".genderfilter");
  for (let gender of genders) {
    //si es el elemento seleccionado
    if (gender.dataset.gender === event.target.dataset.gender) {
      //si no estaba seleccionado anteriormente
      if (appState.genderFilter.gender !== event.target.dataset.gender) {
        gender.classList.add("selectedFilter");
        appState.genderFilter.active = true;
        appState.genderFilter.gender = String(event.target.dataset.gender);
      } else {
        appState.genderFilter.active = false;
        appState.genderFilter.gender = null;
        gender.classList.remove("selectedFilter");
      }
    } else {
      gender.classList.remove("selectedFilter");
    }
  }
}

function handleStatus(event) {
  let statuses;
  if (!event.target.classList.contains("statusfilter")) return;
  statuses = document.querySelectorAll(".statusfilter");
  for (let status of statuses) {
    //si es el elemento seleccionado
    if (status.dataset.status === event.target.dataset.status) {
      //si no estaba seleccionado anteriormente
      if (appState.statusFilter.status !== event.target.dataset.status) {
        status.classList.add("selectedFilter");
        appState.statusFilter.active = true;
        appState.statusFilter.status = String(event.target.dataset.status);
      } else {
        appState.statusFilter.active = false;
        appState.statusFilter.status = null;
        status.classList.remove("selectedFilter");
      }
    } else {
      status.classList.remove("selectedFilter");
    }
  }
}

function init() {
  fetchAndRender();
  nextPageBtn.addEventListener("click", nextAndPrevPageHandler);
  prevPageBtn.addEventListener("click", nextAndPrevPageHandler);
  submitBtn.addEventListener("click", submitHandler);
  genderFilters.addEventListener("click", handleGender);
  statusFilters.addEventListener("click", handleStatus);
}
init();
