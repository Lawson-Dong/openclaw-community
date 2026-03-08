// OpenClaw Community 公共JS

// 切换按钮状态显示
function toggleButtonState(btn, action, count) {
  const icon = btn.querySelector('i');
  
  if (action === 'liked' || action === 'favorited' || action === 'followed') {
    // 已操作状态
    btn.classList.remove('btn-outline-primary', 'btn-outline-danger');
    btn.classList.add(action === 'liked' ? 'btn-danger' : 'btn-primary');
    if (icon) icon.classList.add('bi-heart-fill');
    if (icon) icon.classList.remove('bi-heart');
  } else {
    // 未操作状态
    btn.classList.remove('btn-danger', 'btn-primary');
    btn.classList.add(action === 'unliked' ? 'btn-outline-danger' : 'btn-outline-primary');
    if (icon) icon.classList.remove('bi-heart-fill');
    if (icon) icon.classList.add('bi-heart');
  }
  
  // 更新数字显示
  const text = btn.textContent;
  const newText = text.replace(/\d+/, count);
  btn.innerHTML = btn.innerHTML.replace(text.match(/\d+/)?.[0] || '', count);
}

// 点赞功能
async function likeItem(type, id, btnElement) {
  try {
    const res = await fetch('/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: type, target_id: id })
    });
    
    const data = await res.json();
    
    if (data.success) {
      // 更新按钮状态和数字
      if (btnElement) {
        toggleButtonState(btnElement, data.action, data.likes);
      }
      
      // 显示提示
      const actionText = data.action === 'liked' ? '已点赞' : '已取消点赞';
      showToast(actionText);
      
      // 可选：刷新页面以同步所有数据
      // location.reload();
    } else {
      alert('操作失败，请稍后重试');
    }
  } catch (err) {
    console.error(err);
    alert('操作失败');
  }
}

// 收藏功能
async function favoriteItem(type, id, btnElement) {
  try {
    const res = await fetch('/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: type, target_id: id })
    });
    
    const data = await res.json();
    
    if (data.success) {
      // 更新按钮状态和数字
      if (btnElement) {
        toggleButtonState(btnElement, data.action, data.favorites);
      }
      
      // 显示提示
      const actionText = data.action === 'favorited' ? '已收藏' : '已取消收藏';
      showToast(actionText);
    } else {
      alert('操作失败，请稍后重试');
    }
  } catch (err) {
    console.error(err);
    alert('操作失败');
  }
}

// 关注用户
async function followUser(userId, btnElement) {
  try {
    const res = await fetch(`/follow/${userId}`, { method: 'POST' });
    
    const data = await res.json();
    
    if (data.success) {
      // 更新按钮状态
      if (btnElement) {
        if (data.action === 'followed') {
          btnElement.textContent = '已关注';
          btnElement.classList.remove('btn-outline-primary');
          btnElement.classList.add('btn-primary');
        } else {
          btnElement.textContent = '关注';
          btnElement.classList.remove('btn-primary');
          btnElement.classList.add('btn-outline-primary');
        }
      }
      
      // 更新粉丝数显示
      const followersElement = document.getElementById('followers-count');
      if (followersElement) {
        followersElement.textContent = data.followers;
      }
      
      showToast(data.action === 'followed' ? '关注成功' : '已取消关注');
    } else {
      alert('操作失败，请稍后重试');
    }
  } catch (err) {
    console.error(err);
    alert('操作失败');
  }
}

// 显示Toast提示
function showToast(message) {
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed';
  toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // 显示并自动隐藏
  const bsToast = new bootstrap.Toast(toast, { delay: 2000 });
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// 检查用户是否已登录
function isLoggedIn() {
  return document.body.dataset.userLoggedIn === 'true';
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
  // 自动隐藏alert
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(alert => {
      const closeBtn = alert.querySelector('.btn-close');
      if (closeBtn) closeBtn.click();
    });
  }, 5000);
  
  // 为所有交互按钮添加事件监听
  document.querySelectorAll('[data-like]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.dataset.like;
      const id = btn.dataset.id;
      likeItem(type, id, btn);
    });
  });
  
  document.querySelectorAll('[data-favorite]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.dataset.favorite;
      const id = btn.dataset.id;
      favoriteItem(type, id, btn);
    });
  });
  
  document.querySelectorAll('[data-follow]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = btn.dataset.follow;
      followUser(userId, btn);
    });
  });
});

// 更新页面上的所有数字显示
function updateAllCounts() {
  // 获取当前页面的所有点赞/收藏数并更新
  fetch('/api/user-actions')
    .then(res => res.json())
    .then(data => {
      // 更新UI显示
      console.log('User actions:', data);
    })
    .catch(err => console.error('Failed to fetch user actions:', err));
}
