document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('scanModal');
    const modalBody = document.getElementById('modalBody');
    const closeButton = document.querySelector('.close-button');
  
    // 결과 요약 버튼에 클릭 이벤트 연결
    document.querySelectorAll('.view-summary').forEach(button => {
      button.addEventListener('click', async () => {
        const scanId = button.getAttribute('data-id');
        modalBody.innerHTML = '<p>📡 결과를 불러오는 중입니다...</p>';
        modal.classList.remove('hidden');
  
        try {
          const res = await fetch(`/scanresult/summary/${scanId}`);
          if (!res.ok) throw new Error('요약 정보 요청 실패');
  
          const data = await res.json();
  
          modalBody.innerHTML = `
            <p>🧾 <strong>Scan Name:</strong> ${data.scanName}</p>
            <p>🕐 <strong>상태:</strong> ${data.status}</p>
            <p>👤 <strong>사용자:</strong> ${data.startedBy}</p>
            <p>📅 <strong>시작:</strong> ${new Date(data.startTime).toLocaleString()}</p>
            <p>📅 <strong>종료:</strong> ${data.endTime ? new Date(data.endTime).toLocaleString() : '-'}</p>
            <hr>
            <h4>📊 취약점 요약</h4>
            <ul>
              <li>Critical: ${data.vulnerabilities.critical}</li>
              <li>Severe: ${data.vulnerabilities.severe}</li>
              <li>Moderate: ${data.vulnerabilities.moderate}</li>
              <li><strong>Total: ${data.vulnerabilities.total}</strong></li>
            </ul>
          `;
        } catch (err) {
          modalBody.innerHTML = `<p>❌ 스캔 결과를 불러오지 못했습니다.<br><code>${err.message}</code></p>`;
        }
      });
    });
  
    // 모달 닫기
    closeButton.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
  