// アプリケーション状態
let rides = [];
let editingId = null;
let currentTab = 'list';
let lastSaveFilename = null;
let geminiApiKey = null;

// DOM要素
const elements = {
  // タブ
  listTab: document.getElementById('listTab'),
  searchTab: document.getElementById('searchTab'),
  dateTab: document.getElementById('dateTab'),
  aiTab: document.getElementById('aiTab'),
  
  // ボタン
  addBtn: document.getElementById('addBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  overwriteSaveBtn: document.getElementById('overwriteSaveBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
  submitBtn: document.getElementById('submitBtn'),
  aiSettingsBtn: document.getElementById('aiSettingsBtn'),
  
  // コンテナ
  formContainer: document.getElementById('formContainer'),
  searchContainer: document.getElementById('searchContainer'),
  dateContainer: document.getElementById('dateContainer'),
  aiContainer: document.getElementById('aiContainer'),
  ridesList: document.getElementById('ridesList'),
  statsContainer: document.getElementById('statsContainer'),
  
  // フォーム要素
  rideForm: document.getElementById('rideForm'),
  formTitle: document.getElementById('formTitle'),
  pickupLocation: document.getElementById('pickupLocation'),
  dropoffLocation: document.getElementById('dropoffLocation'),
  rideDate: document.getElementById('rideDate'),
  pickupTime: document.getElementById('pickupTime'),
  dropoffTime: document.getElementById('dropoffTime'),
  durationDisplay: document.getElementById('durationDisplay'),
  durationText: document.getElementById('durationText'),
  
  // 検索
  searchTime: document.getElementById('searchTime'),
  searchResult: document.getElementById('searchResult'),
  searchDate: document.getElementById('searchDate'),
  dateResult: document.getElementById('dateResult'),
  
  // AI
  aiSetupMessage: document.getElementById('aiSetupMessage'),
  aiAdviceContent: document.getElementById('aiAdviceContent'),
  aiSetupBtn: document.getElementById('aiSetupBtn'),
  getAdviceBtn: document.getElementById('getAdviceBtn'),
  currentTime: document.getElementById('currentTime'),
  aiAdviceResult: document.getElementById('aiAdviceResult'),
  aiAdviceText: document.getElementById('aiAdviceText'),
  aiLoading: document.getElementById('aiLoading'),
  
  // AI設定モーダル
  aiSettingsModal: document.getElementById('aiSettingsModal'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
  closeApiSettingsBtn: document.getElementById('closeApiSettingsBtn'),
  
  // 統計
  totalCount: document.getElementById('totalCount'),
  goCount: document.getElementById('goCount'),
  streetCount: document.getElementById('streetCount'),
  
  // iOS プロンプト
  iosPrompt: document.getElementById('ios-install-prompt'),
  closePrompt: document.getElementById('closePrompt')
};

// 初期化
function init() {
  loadRides();
  loadLastFilename();
  loadApiKey();
  setupEventListeners();
  setTodayDate();
  showIOSPrompt();
  renderRides();
  updateAIUI();
  updateCurrentTime();
  setInterval(updateCurrentTime, 60000); // 1分ごとに更新
}

// LocalStorageからデータを読み込み
function loadRides() {
  const saved = localStorage.getItem('taxiRides');
  if (saved) {
    try {
      rides = JSON.parse(saved);
    } catch (e) {
      console.error('データの読み込みに失敗:', e);
      rides = [];
    }
  }
}

// LocalStorageにデータを保存
function saveRides() {
  localStorage.setItem('taxiRides', JSON.stringify(rides));
}

// 最後に使用したファイル名を読み込み
function loadLastFilename() {
  lastSaveFilename = localStorage.getItem('lastSaveFilename');
}

// 最後に使用したファイル名を保存
function saveLastFilename(filename) {
  lastSaveFilename = filename;
  localStorage.setItem('lastSaveFilename', filename);
}

// APIキーを読み込み
function loadApiKey() {
  geminiApiKey = localStorage.getItem('geminiApiKey');
}

// APIキーを保存
function saveApiKey(key) {
  geminiApiKey = key;
  localStorage.setItem('geminiApiKey', key);
  updateAIUI();
}

// 今日の日付をセット
function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  elements.rideDate.value = today;
  elements.searchDate.value = today;
}

// 現在時刻を更新
function updateCurrentTime() {
  if (elements.currentTime) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
    elements.currentTime.textContent = `${dateStr} ${timeStr}`;
  }
}

// AIのUI状態を更新
function updateAIUI() {
  if (geminiApiKey) {
    elements.aiSetupMessage.classList.add('hidden');
    elements.aiAdviceContent.classList.remove('hidden');
  } else {
    elements.aiSetupMessage.classList.remove('hidden');
    elements.aiAdviceContent.classList.add('hidden');
  }
}

// イベントリスナーをセットアップ
function setupEventListeners() {
  // タブ切り替え
  elements.listTab.addEventListener('click', () => switchTab('list'));
  elements.searchTab.addEventListener('click', () => switchTab('search'));
  elements.dateTab.addEventListener('click', () => switchTab('date'));
  elements.aiTab.addEventListener('click', () => switchTab('ai'));
  
  // ボタン
  elements.addBtn.addEventListener('click', showForm);
  elements.cancelBtn.addEventListener('click', hideForm);
  elements.overwriteSaveBtn.addEventListener('click', overwriteSave);
  elements.exportBtn.addEventListener('click', exportData);
  elements.importFile.addEventListener('change', importData);
  
  // AI設定
  elements.aiSettingsBtn.addEventListener('click', openAISettings);
  elements.aiSetupBtn.addEventListener('click', openAISettings);
  elements.saveApiKeyBtn.addEventListener('click', saveAISettings);
  elements.closeApiSettingsBtn.addEventListener('click', closeAISettings);
  elements.getAdviceBtn.addEventListener('click', getAIAdvice);
  
  // フォーム送信
  elements.rideForm.addEventListener('submit', handleSubmit);
  
  // 時刻変更時に所要時間を計算
  elements.pickupTime.addEventListener('change', updateDuration);
  elements.dropoffTime.addEventListener('change', updateDuration);
  
  // 検索
  elements.searchTime.addEventListener('change', handleTimeSearch);
  elements.searchDate.addEventListener('change', handleDateSearch);
  
  // iOS プロンプト
  elements.closePrompt.addEventListener('click', () => {
    elements.iosPrompt.classList.remove('show');
  });
}

// 上書き保存
function overwriteSave() {
  let filename;
  
  if (lastSaveFilename) {
    // 前回のファイル名を使用
    filename = lastSaveFilename;
  } else {
    // 初回は新しいファイル名を作成
    filename = `taxi-rides-${new Date().toISOString().split('T')[0]}.json`;
    saveLastFilename(filename);
  }
  
  const dataStr = JSON.stringify(rides, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  
  // 通知
  alert(`✅ ${filename} に保存しました！`);
}

// AI設定モーダルを開く
function openAISettings() {
  elements.apiKeyInput.value = geminiApiKey || '';
  elements.aiSettingsModal.classList.remove('hidden');
}

// AI設定モーダルを閉じる
function closeAISettings() {
  elements.aiSettingsModal.classList.add('hidden');
}

// AI設定を保存
function saveAISettings() {
  const apiKey = elements.apiKeyInput.value.trim();
  if (!apiKey) {
    alert('APIキーを入力してください');
    return;
  }
  
  saveApiKey(apiKey);
  closeAISettings();
  alert('APIキーを保存しました！');
}

// AIアドバイスを取得
async function getAIAdvice() {
  if (!geminiApiKey) {
    alert('❌ APIキーが設定されていません\n設定ボタン（⚙️）からAPIキーを入力してください。');
    return;
  }
  
  // 現在の時刻を取得
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()];
  
  // 現在時刻の前後2時間のデータを集計
  const recentRides = rides.filter(ride => {
    const rideTime = ride.pickupTime;
    const [rh, rm] = rideTime.split(':').map(Number);
    const rideMinutes = rh * 60 + rm;
    const currentMinutes = hour * 60 + minute;
    const diff = Math.abs(rideMinutes - currentMinutes);
    return diff <= 120; // 前後2時間
  });
  
  // エリアごとの統計
  const locationStats = {};
  recentRides.forEach(ride => {
    const loc = ride.pickupLocation;
    if (!locationStats[loc]) {
      locationStats[loc] = 0;
    }
    locationStats[loc]++;
  });
  
  // プロンプトを作成
  const prompt = `あなたはタクシードライバーのアシスタントです。過去のデータに基づいて、今の時間帯にどのエリアに行けば乗客を見つけやすいかアドバイスしてください。

現在の状況:
- 日時: ${dayOfWeek}曜日 ${hour}:${minute.toString().padStart(2, '0')}
- 過去の同時間帯（前後2時間）の乗車記録: ${recentRides.length}件

エリア別の乗車実績:
${Object.entries(locationStats).map(([loc, count]) => `- ${loc}: ${count}件`).join('\n') || 'データなし'}

上記のデータに基づいて、以下の形式で簡潔にアドバイスしてください:
1. おすすめのエリア（2-3箇所）
2. その理由
3. 注意点やヒント

200文字以内で、親しみやすく具体的にお願いします。`;

  elements.aiAdviceResult.classList.add('hidden');
  elements.aiLoading.classList.remove('hidden');
  
  try {
    console.log('🤖 AI API呼び出し開始...');
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    console.log('📡 APIレスポンス受信:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ APIエラー:', errorData);
      
      let errorMessage = 'AI助言の取得に失敗しました。\n\n';
      
      if (response.status === 400) {
        errorMessage += '❌ APIキーが無効です。\n正しいAPIキーを設定してください。\n\n';
        errorMessage += 'APIキーの取得方法：\n';
        errorMessage += '1. https://makersuite.google.com/app/apikey にアクセス\n';
        errorMessage += '2. 「Create API key」をクリック\n';
        errorMessage += '3. 生成されたキーをコピーして設定';
      } else if (response.status === 403) {
        errorMessage += '❌ APIキーの権限がありません。\n';
        errorMessage += '・APIキーが有効化されているか確認してください\n';
        errorMessage += '・Gemini APIが有効になっているか確認してください';
      } else if (response.status === 429) {
        errorMessage += '⚠️ API利用制限に達しました。\n';
        errorMessage += 'しばらく時間をおいてから再度お試しください。';
      } else {
        errorMessage += `エラーコード: ${response.status}\n`;
        errorMessage += errorData ? JSON.stringify(errorData, null, 2) : '詳細不明';
      }
      
      alert(errorMessage);
      return;
    }
    
    const data = await response.json();
    console.log('✅ APIレスポンス:', data);
    
    // レスポンス構造を確認
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('AIからの応答がありません');
    }
    
    const advice = data.candidates[0].content.parts[0].text;
    
    elements.aiAdviceText.textContent = advice;
    elements.aiAdviceResult.classList.remove('hidden');
    console.log('✅ AI助言表示完了');
    
  } catch (err) {
    console.error('❌ AI助言の取得に失敗:', err);
    
    let errorMessage = 'AI助言の取得に失敗しました。\n\n';
    
    if (err.message.includes('Failed to fetch')) {
      errorMessage += '❌ ネットワークエラー\n';
      errorMessage += '・インターネット接続を確認してください\n';
      errorMessage += '・ブラウザの拡張機能（広告ブロッカーなど）を無効にしてみてください';
    } else {
      errorMessage += '詳細: ' + err.message + '\n\n';
      errorMessage += 'コンソール（F12キー）でエラー詳細を確認できます。';
    }
    
    alert(errorMessage);
  } finally {
    elements.aiLoading.classList.add('hidden');
  }
}

// タブ切り替え
function switchTab(tab) {
  currentTab = tab;
  
  // すべてのタブボタンをリセット
  [elements.listTab, elements.searchTab, elements.dateTab, elements.aiTab].forEach(btn => {
    btn.classList.remove('tab-active');
    btn.classList.add('text-gray-600');
  });
  
  // すべてのコンテナを非表示
  elements.searchContainer.classList.add('hidden');
  elements.dateContainer.classList.add('hidden');
  elements.aiContainer.classList.add('hidden');
  
  // 選択されたタブをアクティブに
  if (tab === 'list') {
    elements.listTab.classList.add('tab-active');
    elements.listTab.classList.remove('text-gray-600');
    renderRides();
  } else if (tab === 'search') {
    elements.searchTab.classList.add('tab-active');
    elements.searchTab.classList.remove('text-gray-600');
    elements.searchContainer.classList.remove('hidden');
    handleTimeSearch();
  } else if (tab === 'date') {
    elements.dateTab.classList.add('tab-active');
    elements.dateTab.classList.remove('text-gray-600');
    elements.dateContainer.classList.remove('hidden');
    handleDateSearch();
  } else if (tab === 'ai') {
    elements.aiTab.classList.add('tab-active');
    elements.aiTab.classList.remove('text-gray-600');
    elements.aiContainer.classList.remove('hidden');
    updateCurrentTime();
  }
}

// フォームを表示
function showForm() {
  elements.formContainer.classList.remove('hidden');
  elements.addBtn.classList.add('hidden');
  setTodayDate();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// フォームを非表示
function hideForm() {
  elements.formContainer.classList.add('hidden');
  elements.addBtn.classList.remove('hidden');
  elements.rideForm.reset();
  editingId = null;
  elements.formTitle.textContent = '新しい乗車記録';
  elements.submitBtn.textContent = '登録';
  elements.durationDisplay.classList.add('hidden');
  setTodayDate();
}

// 所要時間を計算して表示
function updateDuration() {
  const pickup = elements.pickupTime.value;
  const dropoff = elements.dropoffTime.value;
  
  if (pickup && dropoff) {
    const duration = calculateDuration(pickup, dropoff);
    elements.durationText.textContent = duration;
    elements.durationDisplay.classList.remove('hidden');
  } else {
    elements.durationDisplay.classList.add('hidden');
  }
}

// 所要時間を計算
function calculateDuration(pickup, dropoff) {
  const [ph, pm] = pickup.split(':').map(Number);
  const [dh, dm] = dropoff.split(':').map(Number);
  const pickupMinutes = ph * 60 + pm;
  const dropoffMinutes = dh * 60 + dm;
  let duration = dropoffMinutes - pickupMinutes;
  if (duration < 0) duration += 24 * 60;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}時間${minutes}分`;
}

// フォーム送信処理
function handleSubmit(e) {
  e.preventDefault();
  
  const method = document.querySelector('input[name="method"]:checked').value;
  const duration = calculateDuration(elements.pickupTime.value, elements.dropoffTime.value);
  
  const ride = {
    id: editingId || Date.now(),
    pickupLocation: elements.pickupLocation.value,
    dropoffLocation: elements.dropoffLocation.value,
    date: elements.rideDate.value,
    pickupTime: elements.pickupTime.value,
    dropoffTime: elements.dropoffTime.value,
    method: method,
    duration: duration
  };
  
  if (editingId) {
    rides = rides.map(r => r.id === editingId ? ride : r);
  } else {
    rides.push(ride);
  }
  
  saveRides();
  hideForm();
  renderRides();
}

// 編集
function editRide(id) {
  const ride = rides.find(r => r.id === id);
  if (!ride) return;
  
  editingId = id;
  elements.pickupLocation.value = ride.pickupLocation;
  elements.dropoffLocation.value = ride.dropoffLocation;
  elements.rideDate.value = ride.date;
  elements.pickupTime.value = ride.pickupTime;
  elements.dropoffTime.value = ride.dropoffTime;
  document.querySelector(`input[name="method"][value="${ride.method}"]`).checked = true;
  
  elements.formTitle.textContent = '乗車記録を編集';
  elements.submitBtn.textContent = '更新';
  updateDuration();
  showForm();
}

// 削除
function deleteRide(id) {
  if (confirm('この記録を削除しますか?')) {
    rides = rides.filter(r => r.id !== id);
    saveRides();
    renderRides();
  }
}

// 時刻を分に変換
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// 時間検索処理（修正版：±15分）
function handleTimeSearch() {
  const searchTime = elements.searchTime.value;
  
  if (!searchTime) {
    elements.searchResult.classList.add('hidden');
    renderRides();
    return;
  }
  
  const searchMinutes = timeToMinutes(searchTime);
  
  // 前後15分（合計30分幅）で検索
  const filtered = rides.filter(ride => {
    const rideMinutes = timeToMinutes(ride.pickupTime);
    const diff = Math.abs(rideMinutes - searchMinutes);
    return diff <= 15;
  });
  
  // わかりやすい範囲表示
  let startMinutes = searchMinutes - 15;
  let endMinutes = searchMinutes + 15;
  
  // 24時間の範囲内に収める
  if (startMinutes < 0) startMinutes = 0;
  if (endMinutes >= 1440) endMinutes = 1439; // 23:59
  
  const startHour = Math.floor(startMinutes / 60);
  const startMin = startMinutes % 60;
  const endHour = Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;
  
  const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  
  elements.searchResult.textContent = `${searchTime} の前後15分（${startTime}〜${endTime}）の記録を表示中（${filtered.length}件）`;
  elements.searchResult.classList.remove('hidden');
  
  renderRides(filtered);
}

// 日付検索処理
function handleDateSearch() {
  const searchDate = elements.searchDate.value;
  
  if (!searchDate) {
    elements.dateResult.classList.add('hidden');
    renderRides();
    return;
  }
  
  const filtered = rides.filter(ride => ride.date === searchDate);
  
  const date = new Date(searchDate);
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 (${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`;
  
  elements.dateResult.textContent = `${dateStr} の記録を表示中（${filtered.length}件）`;
  elements.dateResult.classList.remove('hidden');
  
  renderRides(filtered);
}

// 乗車記録を描画
function renderRides(ridesToRender = null) {
  const displayRides = ridesToRender || rides;
  
  if (displayRides.length === 0) {
    let message = 'まだ記録がありません。新しい乗車記録を追加してください。';
    if (currentTab === 'search' && elements.searchTime.value) {
      message = '該当する記録がありません';
    } else if (currentTab === 'date' && elements.searchDate.value) {
      message = '該当する記録がありません';
    }
    
    elements.ridesList.innerHTML = `
      <div class="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        ${message}
      </div>
    `;
    elements.statsContainer.classList.add('hidden');
    return;
  }
  
  // 新しい順にソート
  const sorted = [...displayRides].sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.pickupTime);
    const dateB = new Date(b.date + ' ' + b.pickupTime);
    return dateB - dateA;
  });
  
  elements.ridesList.innerHTML = sorted.map(ride => createRideCard(ride)).join('');
  
  // 統計を更新
  updateStats(displayRides);
}

// 乗車カードを作成
function createRideCard(ride) {
  const date = new Date(ride.date);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`;
  const methodClass = ride.method === 'go' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  const methodText = ride.method === 'go' ? 'Go' : '手挙げ';
  
  return `
    <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-xs bg-gray-200 px-2 py-1 rounded">${dateStr}</span>
            <span class="text-xs px-2 py-1 rounded ${methodClass}">${methodText}</span>
          </div>
          <div class="space-y-1">
            <div class="flex items-start gap-2">
              <span class="text-blue-600">📍</span>
              <span class="font-semibold">${ride.pickupLocation}</span>
            </div>
            <div class="flex items-center gap-2 ml-6 text-gray-400">
              <span>↓</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-red-600">📍</span>
              <span class="font-semibold">${ride.dropoffLocation}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="editRide(${ride.id})" class="text-blue-600 hover:bg-blue-50 active:bg-blue-100 p-2 rounded transition">
            ✏️
          </button>
          <button onclick="deleteRide(${ride.id})" class="text-red-600 hover:bg-red-50 active:bg-red-100 p-2 rounded transition">
            🗑️
          </button>
        </div>
      </div>
      <div class="flex items-center gap-4 text-sm text-gray-600 border-t pt-3 flex-wrap">
        <div class="flex items-center gap-1">
          <span>🕐</span>
          <span>${ride.pickupTime} → ${ride.dropoffTime}</span>
        </div>
        <div class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
          ${ride.duration}
        </div>
      </div>
    </div>
  `;
}

// 統計を更新
function updateStats(displayRides) {
  const total = displayRides.length;
  const goCount = displayRides.filter(r => r.method === 'go').length;
  const streetCount = displayRides.filter(r => r.method === 'street').length;
  
  elements.totalCount.textContent = total;
  elements.goCount.textContent = goCount;
  elements.streetCount.textContent = streetCount;
  elements.statsContainer.classList.remove('hidden');
}

// データをエクスポート（別名で保存）
function exportData() {
  const filename = `taxi-rides-${new Date().toISOString().split('T')[0]}.json`;
  const dataStr = JSON.stringify(rides, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  
  // このファイル名を記憶
  saveLastFilename(filename);
}

// データをインポート
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      rides = imported;
      saveRides();
      renderRides();
      alert('データを読み込みました！');
    } catch (error) {
      alert('ファイルの読み込みに失敗しました');
    }
  };
  reader.readAsText(file);
  
  // リセット（同じファイルを再度選択できるように）
  e.target.value = '';
}

// iOS用インストールプロンプトを表示
function showIOSPrompt() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true;
  const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt');
  
  if (isIOS && !isStandalone && !hasSeenPrompt) {
    setTimeout(() => {
      elements.iosPrompt.classList.add('show');
      localStorage.setItem('hasSeenInstallPrompt', 'true');
    }, 2000);
  }
}

// グローバル関数として公開（HTMLから呼び出せるように）
window.editRide = editRide;
window.deleteRide = deleteRide;

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', init);
