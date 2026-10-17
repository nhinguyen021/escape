/* Deterministic garden. Only the stage is saved; storage failure keeps play local. */
(() => {
  const stages = [
    {name:'Hạt mầm', quote:'Mọi khởi đầu đều bé nhỏ.', next:'water', help:'Tiếp theo: tưới nước cho hạt.'},
    {name:'Mầm non', quote:'Từng chút một cũng là tiến về phía trước.', next:'sunlight', help:'Tiếp theo: đón chút nắng cho mầm.'},
    {name:'Cây xanh', quote:'Bạn được phép lớn lên chậm rãi.', next:'water', help:'Tiếp theo: tưới thêm lần nữa để đón hoa.'},
    {name:'Hoa nở', quote:'Một chút chăm chút đã đưa bạn đi xa đến vậy.', next:null, help:'Hoa đã nở rồi. Cứ ở lại bao lâu tùy thích.'}
  ];
  const STORAGE_KEY = 'escape_quiet_forest_garden_v1';
  class ForestGarden {
    #stage = null;
    #storage = null;
    constructor(storageProvider = () => window.localStorage) {
      try {
        this.#storage = storageProvider() || null;
        const raw = this.#storage?.getItem(STORAGE_KEY);
        if (raw == null) return;
        let value;
        try { value = JSON.parse(raw); } catch { return; }
        if (value && typeof value === 'object' && !Array.isArray(value) &&
            Object.keys(value).length === 1 && Object.hasOwn(value, 'stage') &&
            (value.stage === null || (Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 3))) {
          this.#stage = value.stage;
        }
      } catch { this.#storage = null; }
    }
    get storageAvailable() { return this.#storage !== null; }
    #save() {
      if (!this.#storage) return;
      try { this.#storage.setItem(STORAGE_KEY, JSON.stringify({stage:this.#stage})); }
      catch { this.#storage = null; }
    }
    get stage() { return this.#stage; }
    get nextAction() { return this.#stage===null ? 'plant' : stages[this.#stage].next; }
    act(action) {
      if(action===null || action!==this.nextAction)return false;
      this.#stage=this.#stage===null?0:this.#stage+1;
      this.#save();
      return true;
    }
    restart() { if(this.#stage!==3)return false;this.#stage=null;this.#save();return true; }
    get copy() { return this.#stage===null ? {name:'Sẵn sàng gieo mầm',quote:'Một chút đất. Một chút nắng.',help:'Gieo một hạt khi bạn sẵn sàng.'} : stages[this.#stage]; }
  }
  window.EscapeForestGarden=ForestGarden;
  window.EscapeForestStorageKey=STORAGE_KEY;
  document.addEventListener('DOMContentLoaded',()=>{
    const scene=document.getElementById('forest-scene');
    if(!scene)return;
    const garden=new ForestGarden();
    const $=id=>document.getElementById(id);
    const plant=$('forest-plant'),earth=$('forest-earth'),feedback=$('forest-feedback');
    const buttons=[...scene.querySelectorAll('[data-garden-action]')];
    const replay=$('forest-restart');
    function render(moveFocus=false) {
      const copy=garden.copy;
      plant.dataset.stage=garden.stage===null?'empty':String(garden.stage);
      earth.setAttribute('aria-label',garden.stage===null?'Mảnh đất đang chờ một hạt mầm':`${copy.name} trong khu vườn của bạn`);
      $('forest-stage').textContent=copy.name;
      $('forest-quote').textContent=copy.quote;
      $('forest-garden-description').textContent=copy.help;
      const storageNote=$('forest-storage-note');
      if(storageNote)storageNote.textContent=garden.storageAvailable?'Tiến độ được lưu trong trình duyệt này.':'Không lưu được lúc này. Khu vườn vẫn ở đây trong lượt chơi này.';
      for(const button of buttons)button.disabled=button.dataset.gardenAction!==garden.nextAction;
      replay.hidden=garden.stage!==3;
      if(moveFocus)(garden.stage===3?replay:buttons.find(b=>!b.disabled))?.focus({preventScroll:true});
    }
    function animate(action) {
      feedback.classList.remove('is-planting','is-watering','is-sunlight','is-blooming');
      void feedback.offsetWidth;
      feedback.classList.add(`is-${action==='water'?'watering':action==='plant'?'planting':'sunlight'}`);
      if(garden.stage===3)feedback.classList.add('is-blooming');
    }
    buttons.forEach(button=>button.addEventListener('click',()=>{
      if(scene.inert||document.hidden||button.disabled)return;
      const action=button.dataset.gardenAction;
      if(!garden.act(action))return;
      render(true);animate(action);
    }));
    replay.addEventListener('click',()=>{
      if(scene.inert||document.hidden||garden.stage!==3)return;
      if(!window.confirm('Bắt đầu khu vườn mới? Bông hoa hiện tại sẽ được thay bằng một mảnh đất trống.'))return;
      if(!garden.restart())return;
      feedback.classList.remove('is-planting','is-watering','is-sunlight','is-blooming');
      render(true);
    });
    render();
  });
})();
