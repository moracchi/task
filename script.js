document.addEventListener('DOMContentLoaded', function() {
    // -----------------------------------------------
    // 変数とDOM要素の初期化
    // -----------------------------------------------
    const dateInput = document.getElementById('dateInput');
    const formattedDateEl = document.getElementById('formattedDate');
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');
    const pdfButton = document.getElementById('pdfButton');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtn = document.querySelector('.close');
    const saveSettingsBtn = document.getElementById('saveSettings');
    
    // -----------------------------------------------
    // 初期化関数
    // -----------------------------------------------
    function initializeApp() {
        setCurrentDate();
        renderTimeBlocks();
        loadSavedTasks();
        setupEventListeners();
    }

    // 現在の日付を設定
    function setCurrentDate() {
        const today = new Date();
        
        // 日付入力フィールドに今日の日付を設定（yyyy-mm-dd形式）
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
        
        // フォーマットされた日付表示を更新
        updateFormattedDate(today);
    }

    // フォーマットされた日付を更新する関数（2025/03/16（日）形式）
    function updateFormattedDate(dateObj) {
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dayName = dayNames[dateObj.getDay()];
        
        formattedDateEl.textContent = `${year}/${month}/${day}（${dayName}）`;
    }

    // 時間ブロックを生成（2列レイアウト）
    function renderTimeBlocks() {
        leftColumn.innerHTML = '';
        rightColumn.innerHTML = '';
        
        // 左列（8:00-13:30）の時間ブロックを生成
        createTimeBlocks(8, 13, 30, leftColumn);
        
        // 右列（14:00-17:00）の時間ブロックを生成
        createTimeBlocks(14, 17, 0, rightColumn);
    }
    
    // 指定した時間範囲のブロックを生成する関数
    function createTimeBlocks(startHour, endHour, endMinute, container) {
        for (let hour = startHour; hour <= endHour; hour++) {
            // 最終時間の場合は、指定された分まで
            const minuteLimit = (hour === endHour) ? endMinute : 30;
            
            for (let minute = 0; minute < 60; minute += 30) {
                // 終了時刻を超えたらスキップ
                if (hour === endHour && minute > minuteLimit) continue;
                
                const hourStr = String(hour).padStart(2, '0');
                const minuteStr = String(minute).padStart(2, '0');
                const timeLabel = `${hourStr}:${minuteStr}`;
                const blockId = `block-${hourStr}${minuteStr}`;
                
                // タイムブロック要素を作成
                const timeBlock = document.createElement('div');
                timeBlock.className = 'time-block';
                timeBlock.dataset.time = timeLabel;
                timeBlock.id = blockId;
                
                // 時間ラベル（開始時間のみ表示）
                const timeDiv = document.createElement('div');
                timeDiv.className = 'time-label';
                timeDiv.textContent = timeLabel;
                
                // タスク入力エリア
                const taskArea = document.createElement('div');
                taskArea.className = 'task-area';
                
                // シンプルなテキストエリア
                const taskInput = document.createElement('textarea');
                taskInput.className = 'task-input';
                taskInput.placeholder = '';
                taskInput.rows = 1;
                
                // タスク入力エリアを追加
                taskArea.appendChild(taskInput);
                
                // 入力内容が変更されたときにローカルストレージに保存
                taskInput.addEventListener('input', function() {
                    saveTasks();
                    // 内容に応じてテキストエリアの高さを自動調整
                    this.style.height = 'auto';
                    this.style.height = this.scrollHeight + 'px';
                });
                
                // タイムブロックにラベルとタスクエリアを追加
                timeBlock.appendChild(timeDiv);
                timeBlock.appendChild(taskArea);
                
                // 指定された列にタイムブロックを追加
                container.appendChild(timeBlock);
            }
        }
    }

    // イベントリスナーの設定
    function setupEventListeners() {
        // 日付が変更されたとき
        dateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            updateFormattedDate(selectedDate);
            loadSavedTasks(); // 選択された日付のタスクを読み込む
        });
        
        // PDF出力ボタン
        pdfButton.addEventListener('click', generatePDF);
        
        // 設定ボタン
        settingsButton.addEventListener('click', function() {
            settingsModal.style.display = 'block';
        });
        
        // モーダルを閉じるボタン
        closeModalBtn.addEventListener('click', function() {
            settingsModal.style.display = 'none';
        });
        
        // 設定を保存するボタン
        saveSettingsBtn.addEventListener('click', function() {
            saveSettings();
            settingsModal.style.display = 'none';
        });
        
        // モーダル外をクリックして閉じる
        window.addEventListener('click', function(event) {
            if (event.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });
    }

    // -----------------------------------------------
    // タスク保存と読み込み
    // -----------------------------------------------
    
    // タスクをローカルストレージに保存
    function saveTasks() {
        const selectedDate = dateInput.value;
        const blocks = document.querySelectorAll('.time-block');
        const tasksData = {};
        
        blocks.forEach(block => {
            const timeKey = block.dataset.time;
            const taskInput = block.querySelector('.task-input');
            
            if (taskInput && taskInput.value.trim() !== '') {
                tasksData[timeKey] = taskInput.value;
            } else {
                tasksData[timeKey] = '';
            }
        });
        
        localStorage.setItem(`tasks_${selectedDate}`, JSON.stringify(tasksData));
    }
    
    // ローカルストレージからタスクを読み込む
    function loadSavedTasks() {
        const selectedDate = dateInput.value;
        const savedData = localStorage.getItem(`tasks_${selectedDate}`);
        
        if (!savedData) return;
        
        const tasksData = JSON.parse(savedData);
        
        Object.keys(tasksData).forEach(timeKey => {
            const block = document.querySelector(`.time-block[data-time="${timeKey}"]`);
            if (!block) return;
            
            const taskInput = block.querySelector('.task-input');
            if (taskInput) {
                taskInput.value = tasksData[timeKey];
                // 内容に応じてテキストエリアの高さを自動調整
                taskInput.style.height = 'auto';
                taskInput.style.height = taskInput.scrollHeight + 'px';
            }
        });
    }
    
    // -----------------------------------------------
    // PDF生成機能
    // -----------------------------------------------
    
    // PDFを生成
    function generatePDF() {
        // PDF出力時に非表示にする要素
        const elementsToHide = [
            document.querySelector('.action-buttons'),
            document.querySelector('.date-input')
        ];
        
        // 非表示にする
        elementsToHide.forEach(el => {
            if (el) el.style.display = 'none';
        });
        
        // PDF生成
        const { jsPDF } = window.jspdf;
        
        html2canvas(document.getElementById('scheduleContainer'), {
            scale: 2, // 高品質化
            useCORS: true,
            logging: false
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;
            
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            
            // 日付を含めたファイル名でPDFを保存
            const dateStr = formattedDateEl.textContent.replace(/[\/（）]/g, '');
            pdf.save(`スケジュール_${dateStr}.pdf`);
            
            // 非表示にした要素を元に戻す
            elementsToHide.forEach(el => {
                if (el) el.style.display = '';
            });
        });
    }
    
    // -----------------------------------------------
    // 設定関連機能
    // -----------------------------------------------
    
    // 設定を保存
    function saveSettings() {
        const fontSize = document.getElementById('fontSizeSelect').value;
        const theme = document.getElementById('themeSelect').value;
        
        const settings = {
            fontSize,
            theme
        };
        
        localStorage.setItem('scheduler_settings', JSON.stringify(settings));
        
        // 設定を適用
        applySettings(settings);
    }
    
    // 保存された設定を読み込む
    function loadSettings() {
        const savedSettings = localStorage.getItem('scheduler_settings');
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // フォーム要素に設定値を反映
            document.getElementById('fontSizeSelect').value = settings.fontSize;
            document.getElementById('themeSelect').value = settings.theme;
            
            // 設定を適用
            applySettings(settings);
        }
    }
    
    // 設定を適用
    function applySettings(settings) {
        const container = document.getElementById('scheduleContainer');
        
        // フォントサイズ適用
        container.classList.remove('font-small', 'font-medium', 'font-large');
        container.classList.add(`font-${settings.fontSize}`);
        
        // テーマ適用
        container.classList.remove('theme-default', 'theme-minimal', 'theme-elegant');
        container.classList.add(`theme-${settings.theme}`);
    }
    
    // アプリケーションの初期化
    initializeApp();
    loadSettings(); // 保存された設定があれば読み込む
});
