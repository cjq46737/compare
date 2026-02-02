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
    // 与逐行比对结果一致：有任一行 isDiff 则为不一致
    HasDifference() {
      return this.ComparedLines.some((row) => row.isDiff)
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

      // 严格比对：逐行比对且不考虑类型；非严格且 SQL 时按 SQL 语法与注释规范化后再比
      const leftNormLines = this.GetNormalizedLinesForCompare(leftLines, this.leftContent)
      const rightNormLines = this.GetNormalizedLinesForCompare(rightLines, this.rightContent)
      const result = []
      for (let i = 0; i < maxLen; i++) {
        const left = leftLines[i] != null ? leftLines[i] : ''
        const right = rightLines[i] != null ? rightLines[i] : ''
        const leftNorm = leftNormLines[i] ?? ''
        const rightNorm = rightNormLines[i] ?? ''
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
    OnContentKeydown(e, side) {
      if (e.key !== 'Tab') return
      e.preventDefault()
      const ta = e.target
      const val = ta.value
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const tabDisplay = this.ToDisplay('\t')
      const newVal = val.slice(0, start) + tabDisplay + val.slice(end)
      if (side === 'left') {
        this.leftContent = this.FromDisplay(newVal)
      } else {
        this.rightContent = this.FromDisplay(newVal)
      }
      this.$nextTick(() => {
        ta.selectionStart = ta.selectionEnd = start + tabDisplay.length
      })
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
      const stripped = this.strictCompare || this.contentType !== 'sql'
        ? text
        : this.StripSqlComments(text)
      return stripped
        .split('\n')
        .map((line) => this.NormalizeLine(line))
        .join('\n')
    },
    // 非严格且 SQL 时：先剥注释再按行规范化；否则严格用原行，非严格非 SQL 仅按行空白规范化
    GetNormalizedLinesForCompare(lines, fullText) {
      if (this.strictCompare) return lines
      if (this.contentType === 'sql') {
        const stripped = this.StripSqlComments(fullText || '')
        return stripped.split('\n').map((line) => this.NormalizeLine(line))
      }
      return lines.map((line) => this.NormalizeLine(line))
    },
    // 去除 SQL 注释（--、# 单行，/* */ 块），不删除字符串内的符号
    StripSqlComments(text) {
      if (text == null || text === '') return ''
      const s = String(text)
      let out = ''
      let i = 0
      let state = 'normal' // normal | single | double | line | block
      while (i < s.length) {
        const c = s[i]
        const next = s[i + 1]
        if (state === 'normal') {
          if (c === "'") {
            out += c
            state = 'single'
            i += 1
          } else if (c === '"') {
            out += c
            state = 'double'
            i += 1
          } else if (c === '-' && next === '-') {
            state = 'line'
            i += 2
          } else if (c === '#') {
            state = 'line'
            i += 1
          } else if (c === '/' && next === '*') {
            state = 'block'
            i += 2
          } else {
            out += c
            i += 1
          }
        } else if (state === 'single') {
          if (c === "'") {
            if (next === "'") {
              out += "''"
              i += 2
            } else {
              out += c
              state = 'normal'
              i += 1
            }
          } else {
            out += c
            i += 1
          }
        } else if (state === 'double') {
          if (c === '"') {
            out += c
            state = 'normal'
            i += 1
          } else {
            out += c
            i += 1
          }
        } else if (state === 'line') {
          if (c === '\n' || c === '\r') {
            out += c
            state = 'normal'
            i += 1
            if (c === '\r' && next === '\n') {
              out += next
              i += 1
            }
          } else {
            i += 1
          }
        } else if (state === 'block') {
          if (c === '*' && next === '/') {
            state = 'normal'
            i += 2
          } else {
            i += 1
          }
        }
      }
      return out
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
