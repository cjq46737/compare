<template>
  <div class="CompareView">
    <header class="CompareView-header">
      <h1 class="CompareView-title">内容比对</h1>
      <div class="CompareView-actions">
        <button type="button" class="CompareView-btn" @click="ClearLeft">清空左侧</button>
        <button type="button" class="CompareView-btn" @click="ClearRight">清空右侧</button>
        <button type="button" class="CompareView-btn CompareView-btn--primary" @click="SwapContent">交换内容</button>
        <label class="CompareView-sync">
          <input v-model="syncScroll" type="checkbox">
          同步滚动
        </label>
      </div>
    </header>
    <div class="CompareView-body">
      <div class="CompareView-panel CompareView-panel--left">
        <div class="CompareView-panel-header">左侧内容</div>
        <textarea
          v-model="leftContent"
          class="CompareView-textarea"
          placeholder="在此输入或粘贴左侧内容..."
          @scroll="syncScroll && OnLeftScroll($event)"
        />
      </div>
      <div class="CompareView-divider" />
      <div class="CompareView-panel CompareView-panel--right">
        <div class="CompareView-panel-header">右侧内容</div>
        <textarea
          ref="rightTextarea"
          v-model="rightContent"
          class="CompareView-textarea"
          placeholder="在此输入或粘贴右侧内容..."
          @scroll="syncScroll && OnRightScroll($event)"
        />
      </div>
    </div>
    <footer class="CompareView-footer">
      <span class="CompareView-stats">左侧 {{ LeftLineCount }} 行 · 右侧 {{ RightLineCount }} 行</span>
      <span v-if="HasDifference" class="CompareView-diff">内容不一致</span>
      <span v-else class="CompareView-same">内容一致</span>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'CompareView',
  data() {
    return {
      leftContent: '',
      rightContent: '',
      syncScroll: true,
      isScrollingFromSync: false
    }
  },
  computed: {
    LeftLineCount() {
      return this.leftContent ? this.leftContent.split('\n').length : 0
    },
    RightLineCount() {
      return this.rightContent ? this.rightContent.split('\n').length : 0
    },
    HasDifference() {
      return this.leftContent !== this.rightContent
    }
  },
  methods: {
    ClearLeft() {
      this.leftContent = ''
    },
    ClearRight() {
      this.rightContent = ''
    },
    SwapContent() {
      const temp = this.leftContent
      this.leftContent = this.rightContent
      this.rightContent = temp
    },
    OnLeftScroll(event) {
      if (this.isScrollingFromSync) return
      this.isScrollingFromSync = true
      const el = this.$refs.rightTextarea
      if (el) {
        el.scrollTop = event.target.scrollTop
        el.scrollLeft = event.target.scrollLeft
      }
      this.$nextTick(() => {
        this.isScrollingFromSync = false
      })
    },
    OnRightScroll(event) {
      if (this.isScrollingFromSync) return
      this.isScrollingFromSync = true
      const leftEl = this.$el.querySelector('.CompareView-panel--left .CompareView-textarea')
      if (leftEl) {
        leftEl.scrollTop = event.target.scrollTop
        leftEl.scrollLeft = event.target.scrollLeft
      }
      this.$nextTick(() => {
        this.isScrollingFromSync = false
      })
    }
  }
}
</script>

<style scoped>
.CompareView {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1b26;
  color: #a9b1d6;
  font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
}

.CompareView-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #16161e;
  border-bottom: 1px solid #363b54;
}

.CompareView-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #7aa2f7;
}

.CompareView-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.CompareView-btn {
  padding: 6px 14px;
  border: 1px solid #363b54;
  border-radius: 6px;
  background: #24283b;
  color: #a9b1d6;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.CompareView-btn:hover {
  background: #363b54;
  border-color: #565f89;
}

.CompareView-btn--primary {
  border-color: #7aa2f7;
  background: #3d59a1;
  color: #c0caf5;
}

.CompareView-btn--primary:hover {
  background: #4d69b1;
  border-color: #89b4fa;
}

.CompareView-sync {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.CompareView-sync input {
  cursor: pointer;
}

.CompareView-body {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.CompareView-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.CompareView-panel-header {
  flex-shrink: 0;
  padding: 8px 16px;
  background: #24283b;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7aa2f7;
  border-bottom: 1px solid #363b54;
}

.CompareView-panel--right .CompareView-panel-header {
  color: #9ece6a;
}

.CompareView-textarea {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 16px;
  border: none;
  background: #1a1b26;
  color: #c0caf5;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
}

.CompareView-textarea::placeholder {
  color: #565f89;
}

.CompareView-divider {
  width: 2px;
  flex-shrink: 0;
  background: #363b54;
}

.CompareView-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  background: #16161e;
  border-top: 1px solid #363b54;
  font-size: 12px;
  color: #565f89;
}

.CompareView-diff {
  color: #f7768e;
}

.CompareView-same {
  color: #9ece6a;
}
</style>
