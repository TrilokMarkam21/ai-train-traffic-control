/* ====== Shared utilities ====== */

/* highlight current link in sidebar when pages are separate files */
(function highlightSidebar(){
  try {
    const path = (window.location.pathname || "").split("/").pop() || "dashboard.html";
    document.querySelectorAll(".sidebar a").forEach(a=>{
      const href = (a.getAttribute("href") || "").split("/").pop();
      if(href === path || (path === "" && href === "dashboard.html")){
        a.classList.add("active");
      }
    });
  } catch(e){}
})();

/* ====== Simulation logic (used by simulation.html) ====== */
let posA = 0, posB = 0, posC = 0;
let speedA = 3.8, speedB = 3.2, speedC = 4.6;
let simInterval = null;

function startSimulation(){
  if(simInterval) return;
  const limit = Math.max(document.querySelectorAll(".track")[0]?.clientWidth || 800, 800);
  simInterval = setInterval(()=>{
    posA = (posA + speedA) % limit;
    posB = (posB + speedB) % limit;
    posC = (posC + speedC) % limit;
    const a = document.getElementById("trainA");
    const b = document.getElementById("trainB");
    const c = document.getElementById("trainC");
    if(a) a.style.transform = `translateX(${posA}px)`;
    if(b) b.style.transform = `translateX(${posB}px)`;
    if(c) c.style.transform = `translateX(${posC}px)`;
  }, 60);
}

function pauseSimulation(){
  if(simInterval) { clearInterval(simInterval); simInterval = null; }
}

function resetSimulation(){
  pauseSimulation();
  posA = posB = posC = 0;
  ["trainA","trainB","trainC"].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.style.transform = "translateX(0px)";
  });
}

function injectTrain(){
  speedA += 0.9; speedB += 0.9; speedC += 0.9;
}

/* small helper if you want programmatic navigation without links */
function go(page){
  window.location.href = page;
}
