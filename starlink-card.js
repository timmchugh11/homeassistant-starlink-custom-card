class StarlinkCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('starlink-card-editor');
  }

  static getStubConfig() {
    return {
      type: 'custom:starlink-card',
      downlink: '',
      uplink: '',
      ping: '',
      pingdrop: '',
      obstructed: '',
      roaming: '',
      stow: '',
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.hasRendered = false;
  }

  setConfig(config) {
    this.config = {
      downlink: '',
      uplink: '',
      ping: '',
      pingdrop: '',
      obstructed: '',
      roaming: '',
      stow: '',
      ...config,
    };
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
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .card-content {
          position: relative;
          width: 100%;
          aspect-ratio: 666 / 374;
        }

        .starlink-pic {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          object-fit: contain;
        }

        .stat {
          position: absolute;
          font-size: clamp(10px, 1.05vw, 15px);
          line-height: 1;
          font-weight: 400;
          white-space: nowrap;
          cursor: pointer;
          color: var(--primary-text-color, #ffffff);
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.95), 0 0 5px rgba(0, 0, 0, 0.8);
        }

        .down { top: 9%; left: 10%; }
        .up { top: 16%; left: 10%; }
        .ping { top: 23%; left: 10%; }
        .drop { top: 49%; left: 70%; }
        .obstructed { top: 56%; left: 70%; }
        .roaming { top: 63%; left: 70%; }
        .stow { top: 80%; left: 35%; }
      </style>

      <div class="container">
        <div class="card-content">
          <img class="starlink-pic" src="/local/starlink-card/img/mini.png">
          <p class="down stat"></p>
          <p class="up stat"></p>
          <p class="ping stat"></p>
          <p class="drop stat"></p>
          <p class="obstructed stat"></p>
          <p class="roaming stat"></p>
          <p class="stow stat"></p>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(card);

    this.downText = card.querySelector('.down');
    this.upText = card.querySelector('.up');
    this.pingText = card.querySelector('.ping');
    this.dropText = card.querySelector('.drop');
    this.obstructedText = card.querySelector('.obstructed');
    this.roamingText = card.querySelector('.roaming');
    this.stowText = card.querySelector('.stow');

    this.textElems = {
      downText: 'downlink',
      upText: 'uplink',
      pingText: 'ping',
      dropText: 'pingdrop',
      obstructedText: 'obstructed',
      roamingText: 'roaming',
      stowText: 'stow',
    };

    Object.entries(this.textElems).forEach(([prop, configKey]) => {
      this[prop]?.addEventListener('click', () => {
        this.showMoreInfo(this.config?.[configKey]);
      });
    });
  }

  showMoreInfo(entityId) {
    if (!entityId) {
      return;
    }

    this.dispatchEvent(new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId },
    }));
  }

  updateValues() {
    const hass = this._hass;
    const cfg = this.config;

    const getState = (entity) => hass.states[entity]?.state;

    const round = (val, decimals) =>
      isNaN(Number(val)) ? 'unavailable' : Number(val).toFixed(decimals);

    const roundInt = (val) =>
      isNaN(Number(val)) ? 'unavailable' : Math.round(Number(val));

    const down = round(getState(cfg.downlink), 2);
    const up = round(getState(cfg.uplink), 2);
    const ping = roundInt(getState(cfg.ping));
    const drop = round(getState(cfg.pingdrop), 1);
    const obstructed = getState(cfg.obstructed) === 'off' ? 'No Obstructions' : 'Obstructed';
    const roaming = getState(cfg.roaming) === 'off' ? 'Not Roaming' : 'Roaming';

    const stowState = getState(cfg.stow);
    const stowText = stowState === 'on' ? 'Stowed' : 'Not Stowed';

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

class StarlinkCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._entitySignature = '';
  }

  setConfig(config) {
    this._config = {
      type: 'custom:starlink-card',
      downlink: '',
      uplink: '',
      ping: '',
      pingdrop: '',
      obstructed: '',
      roaming: '',
      stow: '',
      ...config,
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    const nextSignature = this.getEntitySignature();
    if (!this.shadowRoot.innerHTML || this._entitySignature !== nextSignature) {
      this._entitySignature = nextSignature;
      this.render();
    }
  }

  get sensorEntities() {
    if (!this._hass) {
      return [];
    }

    return Object.keys(this._hass.states)
      .filter((entityId) => entityId.startsWith('sensor.'))
      .sort((left, right) => left.localeCompare(right));
  }

  get binarySensorEntities() {
    if (!this._hass) {
      return [];
    }

    return Object.keys(this._hass.states)
      .filter((entityId) => entityId.startsWith('binary_sensor.'))
      .sort((left, right) => left.localeCompare(right));
  }

  get switchEntities() {
    if (!this._hass) {
      return [];
    }

    return Object.keys(this._hass.states)
      .filter((entityId) => entityId.startsWith('switch.'))
      .sort((left, right) => left.localeCompare(right));
  }

  getEntitySignature() {
    if (!this._hass) {
      return '';
    }

    return JSON.stringify({
      sensors: this.sensorEntities,
      binarySensors: this.binarySensorEntities,
      switches: this.switchEntities,
    });
  }

  updateConfig(key, value) {
    const newConfig = {
      ...this._config,
      [key]: value,
    };

    this._config = newConfig;
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    }));
  }

  renderEntityOptions(selectedValue, entities, placeholder) {
    const options = [`<option value="">${placeholder}</option>`];
    entities.forEach((entityId) => {
      const selected = entityId === selectedValue ? ' selected' : '';
      options.push(`<option value="${entityId}"${selected}>${entityId}</option>`);
    });
    return options.join('');
  }

  render() {
    if (!this.shadowRoot) {
      return;
    }

    const config = this._config || {};
    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          display: grid;
          gap: 12px;
          padding: 16px 0;
        }
        .field {
          display: grid;
          gap: 6px;
        }
        label {
          font-size: 14px;
          font-weight: 600;
        }
        select {
          padding: 8px;
          font: inherit;
        }
      </style>
      <div class="editor">
        <div class="field">
          <label for="downlink">Downlink Sensor</label>
          <select id="downlink">${this.renderEntityOptions(config.downlink, this.sensorEntities, 'Select sensor')}</select>
        </div>
        <div class="field">
          <label for="uplink">Uplink Sensor</label>
          <select id="uplink">${this.renderEntityOptions(config.uplink, this.sensorEntities, 'Select sensor')}</select>
        </div>
        <div class="field">
          <label for="ping">Ping Sensor</label>
          <select id="ping">${this.renderEntityOptions(config.ping, this.sensorEntities, 'Select sensor')}</select>
        </div>
        <div class="field">
          <label for="pingdrop">Ping Drop Sensor</label>
          <select id="pingdrop">${this.renderEntityOptions(config.pingdrop, this.sensorEntities, 'Select sensor')}</select>
        </div>
        <div class="field">
          <label for="obstructed">Obstructed Binary Sensor</label>
          <select id="obstructed">${this.renderEntityOptions(config.obstructed, this.binarySensorEntities, 'Select binary sensor')}</select>
        </div>
        <div class="field">
          <label for="roaming">Roaming Binary Sensor</label>
          <select id="roaming">${this.renderEntityOptions(config.roaming, this.binarySensorEntities, 'Select binary sensor')}</select>
        </div>
        <div class="field">
          <label for="stow">Stow Switch</label>
          <select id="stow">${this.renderEntityOptions(config.stow, this.switchEntities, 'Select switch')}</select>
        </div>
      </div>
    `;

    ['downlink', 'uplink', 'ping', 'pingdrop', 'obstructed', 'roaming', 'stow'].forEach((key) => {
      this.shadowRoot.getElementById(key)?.addEventListener('change', (event) => {
        this.updateConfig(key, event.target.value);
      });
    });
  }
}

customElements.define('starlink-card-editor', StarlinkCardEditor);

console.info("%c Custom %c Starlink %c Card  ", "font-weight: 500; color: white; background: #666666;", "font-weight: 500; color: #666666; background: white;", "font-weight: 500; color: white; background: #666666;");
