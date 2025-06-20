class StarlinkCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.hasRendered = false;
  }

  setConfig(config) {
    this.config = config;
  }

  getCardSize() {
    return 2;
  }

  set hass(hass) {
    this._hass = hass;

    if (!this.hasRendered) {
      this.renderCard();
      this.hasRendered = true;
    }

    this.updateValues();
  }

  renderCard() {
    const card = document.createElement('ha-card');
    card.innerHTML = `
      <style>
        .starlink-container {
          display: flex;
          justify-content: center;
          position: relative;
        }

        .starlink-container img {
          max-width: 80%;
        }

        .stat {
          position: absolute;
          font-size: 15px;
        }
      </style>

      <div class="starlink-container">
        <img src="/local/starlink-card/img/mini.png">
        <p class="down stat" style="top: 10px; left: 10%;"></p>
        <p class="up stat" style="top: 30px; left: 10%;"></p>
        <p class="ping stat" style="top: 50px; left: 10%;"></p>
        <p class="drop stat" style="top: 110px; left: 65%;"></p>
        <p class="obstructed stat" style="top: 130px; left: 65%;"></p>
        <p class="roaming stat" style="top: 150px; left: 65%;"></p>
        <p class="stow stat" style="top: 250px; left: 55%;"></p>
      </div>
    `;

    this.shadowRoot.appendChild(card);

    // Cache element references
    this.downText = card.querySelector('.down');
    this.upText = card.querySelector('.up');
    this.pingText = card.querySelector('.ping');
    this.dropText = card.querySelector('.drop');
    this.obstructedText = card.querySelector('.obstructed');
    this.roamingText = card.querySelector('.roaming');
    this.stowText = card.querySelector('.stow');
  }

  updateValues() {
    const hass = this._hass;
    const cfg = this.config;

    const getState = (entity) => hass.states[entity]?.state;

    const round = (val, decimals) =>
      isNaN(Number(val)) ? 'unavailable' : Number(val).toFixed(decimals);

    const roundInt = (val) =>
      isNaN(Number(val)) ? 'unavailable' : Math.round(Number(val));

    // Extract values
    const down = round(getState(cfg.downlink), 2);
    const up = round(getState(cfg.uplink), 2);
    const ping = roundInt(getState(cfg.ping));
    const drop = round(getState(cfg.pingdrop), 1);
    const obstructed = getState(cfg.obstructed) === 'off' ? 'No Obstructions' : 'Obstructed';
    const roaming = getState(cfg.roaming) === 'off' ? 'Not Roaming' : 'Roaming';

    const stowState = getState(cfg.stow);
    const stowText = stowState === 'on' ? 'Stowed' : 'Not Stowed';

    // Update UI
    this.downText.textContent = `${down} Mbits/s Down`;
    this.upText.textContent = `${up} Mbits/s Up`;
    this.pingText.textContent = `${ping} ms Ping`;
    this.dropText.textContent = `${drop}% Dropped`;
    this.obstructedText.textContent = obstructed;
    this.roamingText.textContent = roaming;
    this.stowText.textContent = stowText;
  }
}

customElements.define('starlink-card', StarlinkCard);

console.info("%c Custom %c Starlink %c Card  ", "font-weight: 500; color: white; background: #666666;", "font-weight: 500; color: #666666; background: white;", "font-weight: 500; color: white; background: #666666;");
