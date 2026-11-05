
/* Forest Garden — PostgreSQL-backed persistence. */
(() => {
  'use strict';

  const STATE_KEY = 'forest-garden';

  const stages = [
    {
      name: 'Hạt mầm',
      quote: 'Mọi khởi đầu đều bé nhỏ.',
      next: 'water',
      help: 'Tiếp theo: tưới nước cho hạt.'
    },
    {
      name: 'Mầm non',
      quote: 'Từng chút một cũng là tiến về phía trước.',
      next: 'sunlight',
      help: 'Tiếp theo: đón chút nắng cho mầm.'
    },
    {
      name: 'Cây xanh',
      quote: 'Bạn được phép lớn lên chậm rãi.',
      next: 'water',
      help: 'Tiếp theo: tưới thêm lần nữa để đón hoa.'
    },
    {
      name: 'Hoa nở',
      quote: 'Một chút chăm chút đã đưa bạn đi xa đến vậy.',
      next: null,
      help: 'Hoa đã nở rồi. Cứ ở lại bao lâu tùy thích.'
    }
  ];

  function isValidState(value) {
    return value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length === 1 &&
      Object.hasOwn(value, 'stage') &&
      (
        value.stage === null ||
        (
          Number.isInteger(value.stage) &&
          value.stage >= 0 &&
          value.stage <= 3
        )
      );
  }

  class ForestGarden {
    #stage = null;
    #ready = false;
    #saving = false;
    #persistenceAvailable = false;

    get stage() {
      return this.#stage;
    }

    get ready() {
      return this.#ready;
    }

    get saving() {
      return this.#saving;
    }

    get persistenceAvailable() {
      return this.#persistenceAvailable;
    }

    get nextAction() {
      return this.#stage === null
        ? 'plant'
        : stages[this.#stage].next;
    }

    get copy() {
      return this.#stage === null
        ? {
            name: 'Sẵn sàng gieo mầm',
            quote: 'Một chút đất. Một chút nắng.',
            help: 'Gieo một hạt khi bạn sẵn sàng.'
          }
        : stages[this.#stage];
    }

    async load() {
      try {
        if (!window.EscapeAPI) {
          throw new Error('API client chưa được tải.');
        }

        const state = await window.EscapeAPI.getState(STATE_KEY);

        if (state === null) {
          this.#stage = null;
        } else if (isValidState(state)) {
          this.#stage = state.stage;
        } else {
          throw new Error('Dữ liệu khu vườn trên máy chủ không hợp lệ.');
        }

        this.#persistenceAvailable = true;
      } catch (error) {
        this.#persistenceAvailable = false;
        console.error('[Forest Garden] Load failed:', error);
        throw error;
      } finally {
        this.#ready = true;
      }

      return this.#stage;
    }

    async act(action) {
      if (!this.#ready || this.#saving) return false;
      if (action === null || action !== this.nextAction) return false;

      const previousStage = this.#stage;
      this.#stage = previousStage === null
        ? 0
        : previousStage + 1;

      this.#saving = true;

      try {
        await window.EscapeAPI.putState(STATE_KEY, {
          stage: this.#stage
        });
        this.#persistenceAvailable = true;
        return true;
      } catch (error) {
        this.#stage = previousStage;
        console.error('[Forest Garden] Save failed:', error);
        this.#persistenceAvailable = false;
        throw error;
      } finally {
        this.#saving = false;
      }
    }

    async restart() {
      if (!this.#ready || this.#saving || this.#stage !== 3) {
        return false;
      }

      this.#saving = true;

      try {
        await window.EscapeAPI.deleteState(STATE_KEY);
        this.#stage = null;
        this.#persistenceAvailable = true;
        return true;
      } catch (error) {
        console.error('[Forest Garden] Reset failed:', error);
        this.#persistenceAvailable = false;
        throw error;
      } finally {
        this.#saving = false;
      }
    }
  }

  window.EscapeForestGarden = ForestGarden;
  window.EscapeForestStorageKey = STATE_KEY;

  document.addEventListener('DOMContentLoaded', () => {
    const scene = document.getElementById('forest-scene');
    if (!scene) return;

    const garden = new ForestGarden();
    const $ = id => document.getElementById(id);

    const plant = $('forest-plant');
    const earth = $('forest-earth');
    const feedback = $('forest-feedback');
    const buttons = [...scene.querySelectorAll('[data-garden-action]')];
    const replay = $('forest-restart');
    const storageNote = $('forest-storage-note');

    function setNote(message) {
      if (storageNote) storageNote.textContent = message;
    }

    function render(moveFocus = false) {
      const copy = garden.copy;

      plant.dataset.stage = garden.stage === null
        ? 'empty'
        : String(garden.stage);

      earth.setAttribute(
        'aria-label',
        garden.stage === null
          ? 'Mảnh đất đang chờ một hạt mầm'
          : `${copy.name} trong khu vườn của bạn`
      );

      $('forest-stage').textContent = copy.name;
      $('forest-quote').textContent = copy.quote;
      $('forest-garden-description').textContent = copy.help;

      for (const button of buttons) {
        button.disabled =
          !garden.ready ||
          garden.saving ||
          button.dataset.gardenAction !== garden.nextAction;
      }

      replay.hidden = garden.stage !== 3;
      replay.disabled = !garden.ready || garden.saving;

      if (moveFocus) {
        (
          garden.stage === 3
            ? replay
            : buttons.find(button => !button.disabled)
        )?.focus({ preventScroll: true });
      }
    }

    function animate(action) {
      feedback.classList.remove(
        'is-planting',
        'is-watering',
        'is-sunlight',
        'is-blooming'
      );

      void feedback.offsetWidth;

      feedback.classList.add(
        `is-${action === 'water'
          ? 'watering'
          : action === 'plant'
            ? 'planting'
            : 'sunlight'}`
      );

      if (garden.stage === 3) {
        feedback.classList.add('is-blooming');
      }
    }

    buttons.forEach(button => {
      button.addEventListener('click', async () => {
        if (
          scene.inert ||
          document.hidden ||
          button.disabled ||
          !garden.ready ||
          garden.saving
        ) return;

        const action = button.dataset.gardenAction;

        try {
          const changed = await garden.act(action);
          if (!changed) return;

          render(true);
          animate(action);
          setNote('Tiến độ đã được lưu trên máy chủ.');
        } catch (error) {
          render();
          setNote(
            'Không thể lưu tiến độ. Kiểm tra kết nối rồi thử lại.'
          );
        }
      });
    });

    replay.addEventListener('click', async () => {
      if (
        scene.inert ||
        document.hidden ||
        garden.stage !== 3 ||
        garden.saving
      ) return;

      if (!window.confirm(
        'Bắt đầu khu vườn mới? Bông hoa hiện tại sẽ được thay bằng một mảnh đất trống.'
      )) return;

      try {
        const restarted = await garden.restart();
        if (!restarted) return;

        feedback.classList.remove(
          'is-planting',
          'is-watering',
          'is-sunlight',
          'is-blooming'
        );

        render(true);
        setNote('Khu vườn đã được đặt lại trên máy chủ.');
      } catch (error) {
        render();
        setNote(
          'Không thể đặt lại khu vườn trên máy chủ. Tiến độ cũ vẫn được giữ nguyên.'
        );
      }
    });

    render();
    setNote('Đang tải tiến độ khu vườn...');

    garden.load()
      .then(() => {
        render();
        setNote('Tiến độ đã được tải từ máy chủ.');
      })
      .catch(() => {
        render();
        setNote(
          'Không thể tải tiến độ từ máy chủ. Hãy tải lại trang khi kết nối ổn định.'
        );
      });
  });
})();
