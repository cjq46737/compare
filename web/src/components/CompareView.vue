<template>
  <div class="CompareView">
    <header class="CompareView-header">
      <h1 class="CompareView-title">内容比对</h1>
      <div class="CompareView-actions">
        <div class="CompareView-type" :title="strictCompare ? '严格比对时仅逐行比对，不考虑比对类型' : ''">
          <span class="CompareView-type-label">比对类型</span>
          <select v-model="contentType" class="CompareView-select" :disabled="strictCompare">
            <option value="sql">SQL</option>
            <option value="java">Java 源码</option>
            <option value="html">HTML</option>
            <option value="yml">YAML / YML</option>
            <option value="vue">Vue 文件</option>
          </select>
        </div>
        <button type="button" class="CompareView-btn" @click="ClearLeft">清空左侧</button>
        <button type="button" class="CompareView-btn" @click="ClearRight">清空右侧</button>
        <button type="button" class="CompareView-btn CompareView-btn--primary" @click="SwapContent">交换内容</button>
        <label class="CompareView-sync">
          <input v-model="syncScroll" type="checkbox">
          同步滚动
        </label>
        <label class="CompareView-sync">
          <input v-model="strictCompare" type="checkbox">
          严格比对
        </label>
      </div>
    </header>
    <div class="CompareView-body">
      <div class="CompareView-panel CompareView-panel--left">
        <div class="CompareView-panel-header">左侧内容</div>
        <textarea
          ref="leftTextarea"
          class="CompareView-textarea"
          :value="ToDisplay(leftContent)"
          :placeholder="`在此输入或粘贴左侧${ContentTypeDisplay}...`"
          @input="OnLeftInput($event)"
          @scroll="syncScroll && OnLeftScroll($event)"
        />
      </div>
      <div class="CompareView-divider" />
      <div class="CompareView-panel CompareView-panel--right">
        <div class="CompareView-panel-header">右侧内容</div>
        <textarea
          ref="rightTextarea"
          class="CompareView-textarea"
          :value="ToDisplay(rightContent)"
          :placeholder="`在此输入或粘贴右侧${ContentTypeDisplay}...`"
          @input="OnRightInput($event)"
          @scroll="syncScroll && OnRightScroll($event)"
        />
      </div>
    </div>
    <div class="CompareView-result" v-if="ComparedLines.length && HasDifference">
      <div class="CompareView-result-column CompareView-result-column--left">
        <div
          v-for="(line, index) in ComparedLines"
          :key="'left-' + index"
          :class="['CompareView-line', { 'CompareView-line--diff': line.isDiff }]"
        >
          <span class="CompareView-line-number">{{ index + 1 }}</span>
          <span class="CompareView-line-text">{{ line.left }}</span>
        </div>
      </div>
      <div class="CompareView-result-column CompareView-result-column--right">
        <div
          v-for="(line, index) in ComparedLines"
          :key="'right-' + index"
          :class="['CompareView-line', { 'CompareView-line--diff': line.isDiff }]"
        >
          <span class="CompareView-line-number">{{ index + 1 }}</span>
          <span class="CompareView-line-text">{{ line.right }}</span>
        </div>
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
      isScrollingFromSync: false,
      contentType: 'sql',
      strictCompare: true
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
      if (this.strictCompare) return this.leftContent !== this.rightContent
      return this.NormalizedLeft !== this.NormalizedRight
    },
    NormalizedLeft() {
      return this.NormalizeForCompare(this.leftContent)
    },
    NormalizedRight() {
      return this.NormalizeForCompare(this.rightContent)
    },
    ContentTypeDisplay() {
      switch (this.contentType) {
        case 'sql':
          return ' SQL'
        case 'java':
          return ' Java 源码'
        case 'html':
          return ' HTML'
        case 'yml':
          return ' YAML / YML'
        case 'vue':
          return ' Vue 文件'
        default:
          return ' 内容'
      }
    },
    ComparedLines() {
      const leftLines = this.leftContent ? this.leftContent.split('\n') : []
      const rightLines = this.rightContent ? this.rightContent.split('\n') : []
      const maxLen = Math.max(leftLines.length, rightLines.length)

      // 严格比对：逐行比对，且不考虑比对类型（contentType 不参与）
      const result = []
      for (let i = 0; i < maxLen; i++) {
        const left = leftLines[i] != null ? leftLines[i] : ''
        const right = rightLines[i] != null ? rightLines[i] : ''
        const leftNorm = this.strictCompare ? left : this.NormalizeLine(left)
        const rightNorm = this.strictCompare ? right : this.NormalizeLine(right)
        result.push({
          left,
          right,
          isDiff: leftNorm !== rightNorm
        })
      }
      return result
    }
  },
  methods: {
    // 将真实内容转为“可见空白”显示：空格 ·、Tab ⇥、换行 ↵、回车 ␍（零宽前缀防歧义）
    ToDisplay(s) {
      if (s == null || s === '') return ''
      return String(s)
        .replace(/\r\n/g, '\u200B↵\n')
        .replace(/\n/g, '\u200B↵\n')
        .replace(/\r/g, '\u200B␍')
        .replace(/\t/g, '\u200B⇥')
        .replace(/ /g, '\u200B·')
    },
    FromDisplay(s) {
      if (s == null || s === '') return ''
      return String(s)
        .replace(/\u200B↵\n/g, '\n')
        .replace(/\u200B␍/g, '\r')
        .replace(/\u200B⇥/g, '\t')
        .replace(/\u200B·/g, ' ')
    },
    OnLeftInput(e) {
      const ta = e.target
      const raw = ta.value
      const realPrefixLen = this.FromDisplay(raw.substring(0, ta.selectionStart)).length
      this.leftContent = this.FromDisplay(raw)
      this.$nextTick(() => {
        const displayPrefix = this.ToDisplay(this.leftContent.substring(0, realPrefixLen))
        ta.selectionStart = ta.selectionEnd = displayPrefix.length
      })
    },
    OnRightInput(e) {
      const ta = e.target
      const raw = ta.value
      const realPrefixLen = this.FromDisplay(raw.substring(0, ta.selectionStart)).length
      this.rightContent = this.FromDisplay(raw)
      this.$nextTick(() => {
        const displayPrefix = this.ToDisplay(this.rightContent.substring(0, realPrefixLen))
        ta.selectionStart = ta.selectionEnd = displayPrefix.length
      })
    },
    NormalizeForCompare(text) {
      if (!text) return ''
      return text
        .split('\n')
        .map((line) => this.NormalizeLine(line))
        .join('\n')
    },
    NormalizeLine(line) {
      if (line == null) return ''
      return String(line)
        .replace(/\s+/g, ' ')
        .trim()
    },
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
      const leftEl = this.$refs.leftTextarea
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

.CompareView-type {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #1f2335;
}

.CompareView-type-label {
  font-size: 12px;
  color: #9aa5ce;
}

.CompareView-select {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #363b54;
  background: #24283b;
  color: #c0caf5;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}

.CompareView-select:hover {
  border-color: #565f89;
}

.CompareView-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.CompareView-result {
  flex: 1;
  display: flex;
  min-height: 160px;
  max-height: 40vh;
  border-top: 1px solid #363b54;
  background: #111827;
  overflow: auto;
}

.CompareView-result-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 8px 0;
}

.CompareView-result-column--left {
  border-right: 1px solid #363b54;
}

.CompareView-line {
  display: flex;
  align-items: flex-start;
  padding: 0 12px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
  border-left: 3px solid transparent;
}

.CompareView-line-number {
  flex-shrink: 0;
  width: 40px;
  margin-right: 8px;
  text-align: right;
  color: #565f89;
  user-select: none;
}

.CompareView-line-text {
  flex: 1;
  color: #c0caf5;
  word-break: break-all;
}

.CompareView-line--diff {
  background: rgba(247, 118, 142, 0.12);
  border-left-color: #f7768e;
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
  font-size: 16px;
  font-weight: 500;
  color: #f7768e;
}

.CompareView-same {
  font-size: 16px;
  font-weight: 500;
  color: #9ece6a;
}
</style>
