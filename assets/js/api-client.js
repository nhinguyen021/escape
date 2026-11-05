/* Shared API client for Escape modules.
 * The client UUID identifies this browser; it is not an authentication token.
 */
(() => {
  'use strict';

  const CLIENT_ID_KEY = 'escape_client_id_v1';

  function createUuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();

    if (!window.crypto?.getRandomValues) {
      throw new Error('Trình duyệt không hỗ trợ tạo mã định danh an toàn.');
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(value => value.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join('')
    ].join('-');
  }

  function getClientId() {
    let clientId;
    try {
      clientId = window.localStorage.getItem(CLIENT_ID_KEY);
      if (clientId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) {
        return clientId;
      }

      clientId = createUuid();
      window.localStorage.setItem(CLIENT_ID_KEY, clientId);
      return clientId;
    } catch (error) {
      throw new Error('Không thể lưu định danh trình duyệt. Hãy bật quyền lưu trữ của trang web rồi thử lại.', { cause: error });
    }
  }

  async function request(path, options = {}) {
    let response;
    try {
      response = await window.fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': getClientId(),
          ...options.headers
        }
      });
    } catch (error) {
      throw new Error('Không thể kết nối máy chủ Escape. Kiểm tra mạng rồi thử lại.', { cause: error });
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Máy chủ trả về phản hồi không hợp lệ (HTTP ${response.status}).`);
    }

    if (!response.ok) {
      throw new Error(data?.error || `Yêu cầu thất bại (HTTP ${response.status}).`);
    }
    return data;
  }

  function validateKey(key) {
    if (typeof key !== 'string' || !/^[a-z0-9-]+$/.test(key)) {
      throw new TypeError('State key không hợp lệ.');
    }
  }

  window.EscapeAPI = Object.freeze({
    async getState(key) {
      validateKey(key);
      const result = await request(`/api/state/${encodeURIComponent(key)}`, { method: 'GET' });
      return result.state;
    },

    async putState(key, state) {
      validateKey(key);
      const result = await request(`/api/state/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ state })
      });
      return result.state;
    },

    async deleteState(key) {
      validateKey(key);
      await request(`/api/state/${encodeURIComponent(key)}`, { method: 'DELETE' });
      return true;
    }
  });
})();
