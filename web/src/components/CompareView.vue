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
          @keydown="OnContentKeydown($event, 'left')"
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
          @keydown="OnContentKeydown($event, 'right')"
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
          <span class="CompareView-line-text">{{ ToDisplay(line.left) }}</span>
        </div>
      </div>
      <div class="CompareView-result-column CompareView-result-column--right">
        <div
          v-for="(line, index) in ComparedLines"
          :key="'right-' + index"
          :class="['CompareView-line', { 'CompareView-line--diff': line.isDiff }]"
        >
          <span class="CompareView-line-number">{{ index + 1 }}</span>
          <span class="CompareView-line-text">{{ ToDisplay(line.right) }}</span>
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

<script src="./CompareView.js"></script>
<style lang="less" scoped>
@import './CompareView.less';
</style>
