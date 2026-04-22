const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 900;
const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

const app = new PIXI.Application({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  autoStart: true,
  antialias: false,
  backgroundColor: 0x089BA6
});

document.body.appendChild(app.view);

function resize() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  let newWidth = screenWidth;
  let newHeight = screenWidth / ASPECT_RATIO;

  if (newHeight > screenHeight) {
    newHeight = screenHeight;
    newWidth = screenHeight * ASPECT_RATIO;
  }

  app.view.style.width = `${newWidth}px`;
  app.view.style.height = `${newHeight}px`;
}

window.addEventListener('resize', resize);
resize();

app.stage = new PIXI.display.Stage();

PIXI.Loader.registerPlugin(FontLoader);

const loader = PIXI.Loader.shared;

const camera = new PIXI.projection.Camera3d();
camera.position.set(app.screen.width / 2, app.screen.height / 2);
camera.setPlanes(350, 30, 10000);
camera.euler.x = 0;
app.stage.addChild(camera);

loader.add("cards", "assets/cards.json");
loader.add("chips", "assets/chips.json");
loader.add("perth", "assets/perth.woff2");

class BasicController {
  continueButton = document.createElement("button");
  callButton = document.createElement("button");
  foldButton = document.createElement("button");
  allinButton = document.createElement("button");
  upButton = document.createElement("button");
  downButton = document.createElement("button");
  betAmountLabel = document.createElement("p");

  constructor() {
    this.continueButton.innerText = "Continue";
    this.continueButton.className = "continueButton";
    this.callButton.innerText = "Call";
    this.callButton.className = "callButton";
    this.foldButton.innerText = "Fold";
    this.foldButton.className = "foldButton";
    this.allinButton.innerText = "All-in";
    this.allinButton.className = "allinButton";
    this.upButton.innerText = "+";
    this.upButton.className = "upButton";
    this.downButton.innerText = "-";
    this.downButton.className = "downButton";
    this.betAmountLabel.className = "betAmountLabel";
  }

  clickHumanInteraction(parcel) {
    return new Promise(resolve => {
      const callButton = this.callButton.cloneNode(true);
      const foldButton = this.foldButton.cloneNode(true);
      const allinButton = this.allinButton.cloneNode(true);
      const upButton = this.upButton.cloneNode(true);
      const downButton = this.downButton.cloneNode(true);
      const betAmountLabel = this.betAmountLabel.cloneNode(true);
      const buttons = [
        callButton, foldButton, allinButton, upButton, downButton
      ];
      callButton.innerText = parcel.poker.players[0].CallOrCheckWording();
      buttons.forEach(button => document.body.appendChild(button));
      document.body.appendChild(betAmountLabel);
      const amounts = parcel.poker.players[0].AvailableBets(true).filter(x => x !== "All in");
      betAmountLabel.innerText = amounts[0];
      window.pokerBetAmount = parseInt(amounts[0], 10);
      if (!amounts.length) {
        betAmountLabel.style.display = "none";
        upButton.style.display = "none";
        downButton.style.display = "none";
      }
      if (amounts.indexOf(betAmountLabel.innerText) === 0) {
        downButton.disabled = true;
      }
      if (amounts.indexOf(betAmountLabel.innerText) === amounts.length - 1) {
        upButton.disabled = true;
      }
      upButton.addEventListener("click", () => {
        const newValue = amounts[amounts.indexOf(betAmountLabel.innerText) + 1];
        if (newValue) {
          window.pokerBetAmount = parseInt(newValue, 10);
          betAmountLabel.innerText = newValue;
          downButton.disabled = false;
        }
        if (amounts.indexOf(betAmountLabel.innerText) === amounts.length - 1) {
          upButton.disabled = true;
        }
        if (newValue === amounts[0]) {
          callButton.innerText = parcel.poker.players[0].CallOrCheckWording();
        }
        else {
          callButton.innerText = "Raise";
        }
      });
      downButton.addEventListener("click", () => {
        const newValue = amounts[amounts.indexOf(betAmountLabel.innerText) - 1];
        if (newValue) {
          window.pokerBetAmount = parseInt(newValue, 10);
          betAmountLabel.innerText = newValue;
          upButton.disabled = false;
        }
        if (amounts.indexOf(betAmountLabel.innerText) === 0) {
          downButton.disabled = true;
        }
        if (newValue === amounts[0]) {
          callButton.innerText = parcel.poker.players[0].CallOrCheckWording();
        }
        else {
          callButton.innerText = "Raise";
        }
      });
      callButton.addEventListener("click", () => {
        buttons.forEach(button => document.body.removeChild(button));
        document.body.removeChild(betAmountLabel);
        if (callButton.innerText === "Raise") {
          resolve({ type: "raise", amount: parseInt(betAmountLabel.innerText, 10) });
        }
        else {
          resolve("call");
        }
      });
      foldButton.addEventListener("click", () => {
        buttons.forEach(button => document.body.removeChild(button));
        document.body.removeChild(betAmountLabel);
        resolve("fold");
      });
      allinButton.addEventListener("click", () => {
        buttons.forEach(button => document.body.removeChild(button));
        document.body.removeChild(betAmountLabel);
        resolve("all-in");
      });
    });
  }

  clickToEndHand(_parcel) {
    return new Promise(resolve => {
      const continueButton = this.continueButton.cloneNode(true);
      document.body.appendChild(continueButton);
      continueButton.addEventListener("click", () => {
        document.body.removeChild(continueButton);
        resolve(true);
      });
    });
  }
};

const humanController = new BasicController();

const AIType = {
  Standard: "standard",
  Aggressive: "aggressive",
  Conservative: "conservative",
  Amalgamated: "amalgamated",
  AmalgamatedAlt: "amalgamatedalt",
  WildLike: "wildlike",
  SimpleLong: "simplelong",
  Wild: "wild",
  AlwaysBluff: "alwaysbluff",
  AlwaysAllIn: "alwaysallin",
  AlwaysBet: "alwaysbet",
  GBR: "gbr",
  AggressiveGBR: "aggressivegbr",
  AlwaysCall: "alwayscall",
  AlwaysFold: "alwaysfold",
  MCCFR: "mccfr",
  MCCFRFinisher: "mccfrfinisher",
  DefensiveMCCFR: "defensivemccfr",
  GPTHoldem: "gptholdem",
  External: "external",
};

loader.load((_loader, resources) => {
  app.start();
  const pokerUi = new PokerUI(camera, resources, { 
    highCardForDealer: true,
    humanController,
    useAINames: true,
    aiTypes: [
      AIType.MCCFRFinisher,
      AIType.AmalgamatedAlt,
      AIType.GBR,
      AIType.GPTHoldem,
      AIType.SimpleLong,
      AIType.WildLike
    ],
    isSmallScreen: true
  });
  app.ticker.add((dt) => {
    pokerUi.update(dt);
  });
  window.pokerUi = pokerUi;
  pokerUi.run();
});
