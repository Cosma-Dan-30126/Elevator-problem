// Configurare si Selectia etajelor
const NUM_FLOORS = 7;
const container_etaje = document.getElementById('container_etaje');

//Configuroare butoane si sageti etaje
for (let i=0; i<NUM_FLOORS; i++) {
    const rand = document.createElement('div');
    rand.className = 'rand_etaj';


const upBtn = i<6 ? `<button class="btn-nav" onclick="controller.callLift(${i}, 'GOING UP')">▲</button>` : '';
const downBtn = i>0 ? `<button class="btn-nav" onclick="controller.callLift(${i}, 'GOING DOWN')">▼</button>` : '';

    rand.innerHTML = `
        <div class="eticheta_etaj">Etaj ${i}</div>
        <div class= "etaj-arrows" id="arrows-${i}">
            <span class="arrow-up">▲</span>
            <span class="arrow-down">▼</span>
        </div>

        <div class="butoane-navigatie">
            ${upBtn} ${downBtn}
        </div>
    `;
    container_etaje.prepend(rand);   // Prepend pentru ca 6 să fie sus
}

// Configurare butoane interioare panouri
['A', 'B'].forEach(id => {
    const grid = document.getElementById(`intern-btns-${id}`);
    for(let i=0; i<NUM_FLOORS; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-intern';
        btn.innerText = i;
        btn.onclick = () => controller.selectDestination(id, i);
        grid.appendChild(btn);
    }
});

class Lift{
    constructor(id, startFloor) {
        this.id = id;
        this.currentFloor = startFloor;
        this.destination = null;
        this.state = 'IDLE'; // IDLE, MOVING, DOORS_OPEN
        this.direction = 'IDLE'; // UP, DOWN, IDLE

// Elemente DOM
        this.element = document.getElementById(`lift-${id}`);
        this.display = this.element.querySelector(`.afisaj-etaj`);
        this.panelDisplay = document.getElementById(`afisaj-panou-${id}`);
        this.panelStatus = document.getElementById(`stare-${id}`);
}

    moveTo(etaj) {
        if (this.state !== 'IDLE' && this.state !== 'DOORS_OPEN') return; 
        this.destination = etaj;
        this.state = 'MOVING';
        this.direction = this.destination > this.currentFloor ? 'UP' : 'DOWN';
        this.updatePanelStatus();

        //in aceasta instructiune trb sa calclez distanta si timpul necesar liftului sa circule intre etaje
        const dist= Math.abs(etaj-this.currentFloor);
        const durata = dist * 1000; // 1s per etaj

        //Alipim elementul din CSS
        this.element.style.transition =`bottom ${durata}ms linear`;
        this.element.style.bottom = `${etaj * 14.28}%`; // Fiecare etaj reprezintă 14.28% din înălțimea totală (100% / 7 etaje)

        //simularea sosirii liftului la etaj
        setTimeout(() => {
            this.arriveAtEtaj(etaj);
        }, durata);
    }

    arriveAtEtaj(etaj) {
        this.currentFloor = etaj;
        this.state = 'DOORS_OPEN';
        this.direction = 'IDLE';
        this.display.innerText = etaj;
        this.panelDisplay.innerText = etaj;
        this.updatePanelStatus();


        resetFloorArrows(etaj);

        console.log(`Lift ${this.id} a ajuns la etajul ${etaj}.`);

         // După 3 secunde, intră în IDLE și închide ușile, gata de o nouă comandă
        setTimeout(() => {
            this.state = 'IDLE';
            this.updatePanelStatus();
        }, 3000);
}
    updatePanelStatus() {
        this.panelStatus.innerText = `Stare: ${this.state} (Etaj: ${this.currentFloor})`;
         // Actualizam sagețile de pe etajul curent in timp ce trece
        // aprindem săgețile doar când e MOVING
        if (this.state === 'MOVING') {
            updateFloorArrows(this.currentFloor, this.direction === 'UP');
        }
    }

}

class Controller {
    constructor(){
        this.lifts =[
            new Lift('A', 0),
            new Lift('B', 6)
        ];
    }

    callLift(etaj, directie) {
        console.log('>> Buton ${directie} apăsat la etajul ${etaj}');
        // Alegem cel mai apropiat lift disponibil
        const bestLift = this.findBestLift(etaj);

        if (!bestLift) {
            alert("Lifturile sunt ocupate in acest moment. Asteptati va rog!");
            return;
        }
        bestLift.moveTo(etaj);
}

    findBestLift(targetEtaj) {
        const liftA= this.lifts[0];
        const liftB= this.lifts[1];

        const aOcupat=liftA.state === 'MOVING';
        const bOcupat=liftB.state === 'MOVING';

        if (aOcupat && bOcupat) return null;
        if(aOcupat) return liftB;
        if(bOcupat) return liftA;

        //Calculare distanta lifturi intre etaj curent si cel cerut de utilizator
        const distA= Math.abs(liftA.currentFloor - targetEtaj);
        const distB= Math.abs(liftB.currentFloor - targetEtaj);

        if (distA < distB) return liftA;
        if (distB < distA) return liftB;

        if(distA===distB){
            console.log("Distanta dintre cele 2 lifturi este egala. In acest caz, liftul de la parter va fi trimis.");
            return liftA.currentFloor< liftB.currentFloor ? liftA : liftB;
        }
    }

    //Comanda liftului din interior dupa ce acesta a sosit.
    selectDestination(liftId, targetEtaj){
        const lift = this.lifts.find(e => e.id === liftId);

        //Liftul primeste comenzi daca este Idle sau daca usile sunt deschise
        //Poti apasa butonul doar daca liftul e oprit la un etaj.
        if (lift.state === 'MOVING') {
            console.warn("Liftul nu accepta comenzi in timp ce se misca.");
            return;
    }

    console.log('[interior Lift ${liftId}] Etaj ales: ${targetEtaj}');
    lift.moveTo (targetEtaj);
}
}

function updateFloorArrows(floorIndex, isUp) {
    // Aprindem săgeata corespunzătoare pe etajul curent (simulare trecere)
    // Nota: Într-o aplicație reală, asta s-ar actualiza la fiecare etaj traversat.
}

function resetFloorArrows(etaj) {
    // Reset arrows color
}

// Initializare
const controller = new Controller();