// Configurare si Selectia etajelor
const NUM_FLOORS = 7;

const container_floors = document.getElementById("container_floors");

//Configuroare butoane si sageti etaje
for (let i = 0; i < NUM_FLOORS; i++) {
  const rand = document.createElement("div");
  rand.className = "row_floor";

  const upBtn =
    i < 6
      ? `<button id="btn-up-${i}" class="btn-nav" onclick="controller.callLift(${i}, 'GOING UP')">▲</button>`
      : "";
  const downBtn =
    i > 0
      ? `<button id="btn-down-${i}" class="btn-nav" onclick="controller.callLift(${i}, 'GOING DOWN')">▼</button>`
      : "";

  rand.innerHTML = `
        <div class="tag_floor">Floor ${i}</div>
        <div class= "floor_arrows" id="arrows-${i}">
            <span class="arrow-up">▲</span>
            <span class="arrow-down">▼</span>
        </div>

        <div class="butoane-navigatie">
            ${upBtn} ${downBtn}
        </div>
    `;
  container_floors.prepend(rand); // Prepend pentru ca 6 să fie sus
}

// Configurare butoane interioare panouri
["A", "B"].forEach((id) => {
  const grid = document.getElementById(`intern-btns-${id}`);
  for (let i = 0; i < NUM_FLOORS; i++) {
    const btn = document.createElement("button");
    btn.id = `btn-intern-${id}-${i}`;
    btn.className = "btn-intern";
    btn.innerText = i;
    btn.onclick = () => controller.selectDestination(id, i);
    grid.appendChild(btn);
  }
});

class Lift {
  constructor(id, startFloor) {
    this.id = id;
    this.currentFloor = startFloor;
    this.destination = null;
    this.state = "IDLE"; // IDLE, MOVING, DOORS_OPEN
    this.direction = "IDLE"; // UP, DOWN, IDLE

    // Elemente DOM
    this.element = document.getElementById(`lift-${id}`);
    this.display = this.element.querySelector(`.floor_view`);
    this.panelDisplay = document.getElementById(`view_pannel_${id}`);
    this.panelStatus = document.getElementById(`state-${id}`);
  }

  moveTo(floor) {
    if (this.state !== "IDLE" && this.state !== "DOORS_OPEN") return;
    this.element.classList.remove("open");
    this.destination = floor;
    this.state = "MOVING";
    this.direction = this.destination > this.currentFloor ? "UP" : "DOWN";
    this.updatePanelStatus();

    //in aceasta instructiune trb sa calclez distanta si timpul necesar liftului sa circule intre etaje
    const dist = Math.abs(floor - this.currentFloor);
    const time = dist * 1000; // 1s per floor

    //Alipim elementul din CSS
    this.element.style.transition = `bottom ${time}ms linear`;
    this.element.style.bottom = `${floor * 14.28}%`; // Fiecare floor reprezintă 14.28% din înălțimea totală (100% / 7 etaje)

    //simularea sosirii liftului la floor
    setTimeout(() => {
      this.arriveAtEtaj(floor);
    }, time);
  }

  arriveAtEtaj(floor) {
    this.currentFloor = floor;
    this.state = "DOORS_OPEN";
    this.element.classList.add("open");
    this.direction = "IDLE";
    this.display.innerText = floor;
    this.panelDisplay.innerText = floor;
    this.updatePanelStatus();

    //Adaug o logica de stingere a butoanelor dupa ce liftul a ajuns la destinatie
    const upBtn= document.getElementById(`btn-up-${floor}`);
    const downBtn= document.getElementById(`btn-down-${floor}`);
    if (upBtn) upBtn.classList.remove("active");
    if (downBtn) downBtn.classList.remove("active");
    
    const internBtn= document.getElementById(`btn-intern-${this.id}-${floor}`);
    if (internBtn) internBtn.classList.remove("active");
    resetFloorArrows(floor);

    console.log(`Lift ${this.id} a ajuns la etajul ${floor}.`);

    // După 3 secunde, intră în IDLE și închide ușile, gata de o nouă comandă
    setTimeout(() => {
      this.element.classList.remove("open");  
      this.state = "IDLE";
      this.updatePanelStatus();
    }, 3000);
  }
  updatePanelStatus() {
    this.panelStatus.innerText = `State: ${this.state} (Floor: ${this.currentFloor})`;
    // Actualizam sagețile de pe etajul curent in timp ce trece
    // aprindem săgețile doar când e MOVING
    if (this.state === "MOVING") {
      updateFloorArrows(this.currentFloor, this.direction === "UP");
    }
  }
}

class Controller {
  constructor() {
    this.lifts = [new Lift("A", 0), new Lift("B", 6)];
  }

  callLift(floor, direction) {
    console.log(`>> Buton ${direction} apăsat la etajul ${floor}`);

    // Marcam butonul ca activ
    const suffix = direction === "GOING UP" ? "up" : "down";
    const btnId=`btn-${suffix}-${floor}`;
    document.getElementById(btnId).classList.add("active");
    // Alegem cel mai apropiat lift disponibil
    const bestLift = this.findBestLift(floor);

    if (!bestLift) {
      alert("Lifturile sunt ocupate in acest moment. Asteptati va rog!");
      return;
    }
    bestLift.moveTo(floor);
  }

  findBestLift(targetFloor) {
    const liftA = this.lifts[0];
    const liftB = this.lifts[1];

    const A_busy = liftA.state === "MOVING";
    const B_busy = liftB.state === "MOVING";

    if (A_busy && B_busy) return null;
    if (A_busy) return liftB;
    if (B_busy) return liftA;

    //Calculare distanta lifturi intre floor curent si cel cerut de utilizator
    const distA = Math.abs(liftA.currentFloor - targetFloor);
    const distB = Math.abs(liftB.currentFloor - targetFloor);

    if (distA < distB) return liftA;
    if (distB < distA) return liftB;

    if (distA === distB) {
      console.log(
        "Distanta dintre cele 2 lifturi este egala. In acest caz, liftul de la parter va fi trimis.",
      );
      return liftA.currentFloor < liftB.currentFloor ? liftA : liftB;
    }
  }

  //Comanda liftului din interior dupa ce acesta a sosit.
  selectDestination(liftId, targetFloor) {
    const lift = this.lifts.find((e) => e.id === liftId);

    //Liftul primeste comenzi daca este Idle sau daca usile sunt deschise
    //Poti apasa butonul doar daca liftul e oprit la un floor.
    if (lift.state === "MOVING") {
      console.warn("Liftul nu accepta comenzi in timp ce se misca.");
      return;
    }

    const btnId= `btn-intern-${liftId}-${targetFloor}`;
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.classList.add('active'); // Folosim clasa .selected din CSS-ul tău
    }

    console.log(`[interior Lift ${liftId}] Etaj ales: ${targetFloor}`);
    lift.moveTo(targetFloor);
  }
}

function updateFloorArrows(floorIndex, isUp) {
  // Aprindem săgeata corespunzătoare pe etajul curent (simulare trecere)
  // Nota: Într-o aplicație reală, asta s-ar actualiza la fiecare floor traversat.
}

function resetFloorArrows(floor) {
  // Reset arrows color
}

// Initializare
const controller = new Controller();
