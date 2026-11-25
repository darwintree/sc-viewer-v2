<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <div ref="panelRef" class="tts-studio">
      <!-- Primary Unified Studio Sheet -->
      <section class="studio-sheet" aria-label="语音生成工作区">
        <header class="studio-masthead">
          <h1>语音生成</h1>
          <p>选择角色并输入日文台词即可合成，可按需搭配语气描述或参考音频。</p>
        </header>

        <div
          v-if="!ttsBase"
          class="inline-notice inline-notice--warn"
          role="alert"
        >
          <span>
            服务未配置：请设置环境变量 <code>VITE_TTS_SERVER</code>（或
            <code>VITE_GENIE_SERVER</code>）指向 TTS 服务地址。
          </span>
        </div>

        <div
          v-if="undoNotice"
          class="inline-notice inline-notice--info"
          role="status"
        >
          <span>{{ undoNotice.message }}</span>
          <div class="inline-notice-actions">
            <button
              type="button"
              class="text-action text-action--accent"
              @click="applyUndoNotice"
            >
              撤销
            </button>
            <button
              type="button"
              class="text-action"
              @click="dismissUndoNotice"
            >
              关闭
            </button>
          </div>
        </div>

        <!-- Band 1: Voice Identity & Quick Recent Speakers -->
        <div class="studio-band">
          <div class="band-head">
            <h2>角色与音色</h2>
            <span class="band-meta">
              <template v-if="selectedSpeaker">
                {{ selectedSpeakerUnit || '283 PRO' }} ·
                {{ hasReferenceAudio ? '参考音频克隆' : '内置音色' }}
              </template>
              <template v-else
                >29 位角色，支持简体中文、全名与团体名搜索</template
              >
            </span>
          </div>

          <div class="voice-picker-row">
            <div
              class="voice-avatar-frame"
              :class="{ 'voice-avatar-frame--active': !!selectedSpeaker }"
              aria-hidden="true"
            >
              <img
                v-if="selectedSpeaker"
                :src="getAvatarPath(selectedSpeaker)"
                :alt="selectedSpeaker"
                class="voice-avatar-img"
              />
              <n-icon v-else size="20" class="voice-avatar-icon">
                <Microphone />
              </n-icon>
            </div>

            <div ref="speakerControlRef" class="voice-picker-control">
              <n-select
                ref="speakerSelectRef"
                :value="selectedSpeaker"
                :options="speakerGroupOptions"
                :render-label="renderSpeakerOption"
                :render-tag="renderSpeakerTrigger"
                :filter="filterSpeakerOption"
                :input-props="{ 'aria-label': '选择角色与音色' }"
                placeholder="搜索角色名、全名或团体（如：圆香 / 樋口 / noctchill）"
                filterable
                size="medium"
                class="speaker-select"
                @update:value="handleSpeakerChange"
              />
            </div>
          </div>

          <div
            v-if="recentSpeakers.length"
            class="recent-speakers"
            role="group"
            aria-label="最近使用的角色"
          >
            <span class="recent-speakers-label">最近</span>
            <div class="recent-speakers-list">
              <button
                v-for="name in recentSpeakers"
                :key="name"
                type="button"
                class="recent-speaker-item"
                :class="{
                  'recent-speaker-item--active': selectedSpeaker === name,
                }"
                :aria-pressed="selectedSpeaker === name"
                @click="handleSpeakerChange(name)"
              >
                <img :src="getAvatarPath(name)" alt="" class="recent-avatar" />
                <span>{{ name }}</span>
              </button>
            </div>
          </div>

          <div v-if="referenceAudioProps" class="reference-strip">
            <div class="reference-strip-top">
              <div class="reference-audio-wrap">
                <span class="reference-label">参考音频</span>
                <AudioLabel
                  v-bind="referenceAudioProps"
                  :audio-text="referenceText"
                  extra-text="点击试听"
                  display-download
                />
              </div>
              <button
                type="button"
                class="text-action text-action--warn"
                @click="clearReferenceWithUndo"
              >
                恢复内置音色
              </button>
            </div>
            <p class="reference-mode-explain">
              当前将按下方参考音频克隆音色与语调；切换其他角色会自动恢复内置音色（可撤销）。
            </p>
            <p
              v-if="referenceText.trim()"
              class="reference-transcript"
              lang="ja"
            >
              <span class="reference-transcript-prefix">原台词</span>
              {{ referenceText }}
            </p>
          </div>
          <p v-else class="voice-mode-note">
            <template v-if="selectedSpeaker">
              当前使用
              {{ selectedSpeaker }} 的内置音色；如需模仿特定台词语调，可
            </template>
            <template v-else>选择角色即可直接用内置音色生成，也可</template>
            <button type="button" class="inline-link" @click="goToVoiceSearch">
              去语音搜索页挑选参考音频
            </button>
            。
          </p>
        </div>

        <!-- Band 2: Script Composer -->
        <div class="studio-band studio-band--script">
          <div class="band-head">
            <label for="tts-script-input" class="band-heading-label">
              台词
            </label>
            <span class="band-meta tabular">
              {{ ttsText.trim().length }} 字 · Ctrl / Cmd + Enter 生成
            </span>
          </div>

          <textarea
            id="tts-script-input"
            ref="scriptInputRef"
            v-model="ttsText"
            class="studio-textarea studio-textarea--script"
            rows="3"
            lang="ja"
            placeholder="请输入要生成的日文台词"
            @keydown="handleScriptKeydown"
          />
        </div>

        <!-- Band 3: Optional Direction + Always-Discoverable Quick Presets -->
        <div class="studio-band studio-band--direction">
          <div class="band-head">
            <div class="band-head-group">
              <label for="tts-caption-input" class="band-heading-label">
                语气描述
              </label>
              <span class="optional-label">选填</span>
              <span class="band-meta">
                <template v-if="matchedCaptionPreset">
                  已选：{{ matchedCaptionPreset.zh }}
                </template>
                <template v-else>日文自然句控制语气，留空自然发挥</template>
              </span>
            </div>
            <div class="direction-head-actions">
              <button
                type="button"
                class="text-action text-action--accent preset-expand-trigger"
                :aria-expanded="presetsOpen"
                aria-controls="tts-preset-drawer"
                @click="presetsOpen = !presetsOpen"
              >
                <span>
                  {{
                    presetsOpen
                      ? '收起预设'
                      : `全部 ${CAPTION_PRESETS.length} 条（含日文）`
                  }}
                </span>
                <n-icon
                  size="14"
                  class="chevron-icon"
                  :class="{ 'chevron-icon--open': presetsOpen }"
                  aria-hidden="true"
                >
                  <ChevronDown />
                </n-icon>
              </button>
              <button
                v-if="captionText.trim()"
                type="button"
                class="text-action"
                @click="captionText = ''"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            id="tts-caption-input"
            v-model="captionText"
            class="studio-textarea studio-textarea--caption"
            rows="2"
            lang="ja"
            placeholder="留空自然发挥；可输入日文语气描述，或直接点选下方常用语气"
            @keydown="handleScriptKeydown"
          />

          <p
            v-if="showNonJapaneseCaptionHint"
            class="inline-notice inline-notice--warn"
          >
            <span>
              未检测到日文假名，模型对日文自然句描述控制效果更好，建议改用日文或点选下方预设。
            </span>
          </p>

          <!-- Compact Quick-Pick Row (Visible When Collapsed) -->
          <div v-if="!presetsOpen" class="quick-preset-bar">
            <div
              class="quick-preset-list"
              role="group"
              aria-label="常用语气快捷选择"
            >
              <button
                v-for="preset in QUICK_PRESETS"
                :key="preset.ja"
                type="button"
                class="quick-preset-btn"
                :class="{
                  'quick-preset-btn--active': captionText.trim() === preset.ja,
                }"
                :aria-pressed="captionText.trim() === preset.ja"
                :title="`${preset.zh}：${preset.ja}`"
                @click="toggleQuickPreset(preset.ja)"
              >
                {{ preset.shortZh }}
              </button>
            </div>
          </div>

          <!-- Full Bilingual Preset Drawer -->
          <div v-else id="tts-preset-drawer" class="preset-block">
            <div class="preset-toolbar">
              <div
                class="segmented-tabs"
                role="group"
                aria-label="语气分类筛选"
              >
                <button
                  v-for="tab in PRESET_CATEGORIES"
                  :key="tab.key"
                  type="button"
                  :aria-pressed="activePresetCategory === tab.key"
                  class="segmented-tab"
                  :class="{
                    'segmented-tab--active': activePresetCategory === tab.key,
                  }"
                  @click="activePresetCategory = tab.key"
                >
                  {{ tab.label }}
                </button>
              </div>
              <span class="band-meta">点选填入并收起，再次点击取消</span>
            </div>

            <div class="preset-grid" role="group" aria-label="日文语气预设列表">
              <button
                v-for="preset in filteredPresets"
                :key="preset.ja"
                type="button"
                :aria-pressed="captionText.trim() === preset.ja"
                class="preset-cell"
                :class="{
                  'preset-cell--active': captionText.trim() === preset.ja,
                }"
                @click="selectCaptionPreset(preset.ja)"
              >
                <span class="preset-cell-zh">{{ preset.zh }}</span>
                <span class="preset-cell-ja" lang="ja">{{ preset.ja }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Band 4: Form Footer CTA With Immediate Missing-Field Guidance -->
        <div class="studio-footer">
          <div class="composer-actions">
            <button
              type="button"
              class="primary-cta"
              :disabled="!canSubmit"
              @click="createTask"
            >
              {{ submitting ? '提交中…' : '生成语音' }}
            </button>

            <button
              v-if="missingFieldGuide"
              type="button"
              class="missing-guide-btn"
              @click="focusMissingField"
            >
              {{ missingFieldGuide.label }}
            </button>
            <span
              v-else-if="waitingTaskCount > 0"
              class="waiting-summary tabular"
              role="status"
            >
              {{ waitingTaskCount }} 个任务处理中
            </span>
          </div>

          <p v-if="!missingFieldGuide && ttsBase" class="composer-summary">
            {{ selectedSpeaker }} ·
            {{ hasReferenceAudio ? '参考音频' : '内置音色' }}
            <template v-if="matchedCaptionPreset">
              · {{ matchedCaptionPreset.shortZh }}
            </template>
            <template v-else-if="captionText.trim()"> · 自定义语气</template>
          </p>
        </div>

        <div
          v-if="errorMessage"
          class="inline-notice inline-notice--error studio-sheet-error"
          role="alert"
        >
          <span>{{ errorMessage }}</span>
        </div>
      </section>

      <!-- Output & Deduplicated History Ledger (Directly Below CTA) -->
      <section
        v-if="currentTaskItem || visibleHistoryItems.length"
        ref="ledgerRef"
        class="ledger-sheet"
        aria-label="生成结果与历史记录"
      >
        <!-- Current Active Task -->
        <div
          v-if="currentTaskItem"
          class="ledger-section ledger-section--current"
          :class="{
            'ledger-section--just-ready':
              justCompletedTaskId === currentTaskItem.taskId,
          }"
        >
          <div class="ledger-section-head">
            <h2>当前结果</h2>
            <div class="task-actions">
              <button
                v-if="isWaitingStatus(currentTaskItem.status?.status)"
                type="button"
                class="text-action"
                @click="refreshCurrentTask"
              >
                刷新状态
              </button>
              <button
                type="button"
                class="text-action text-action--accent"
                @click="reuseCurrentTask"
              >
                复用参数
              </button>
              <button
                type="button"
                class="text-action text-action--danger"
                @click="removeCurrentTask"
              >
                删除
              </button>
            </div>
          </div>

          <article class="task-entry task-entry--current">
            <div class="task-entry-head">
              <div class="task-identity">
                <img
                  v-if="currentTaskItem.speaker"
                  :src="getAvatarPath(currentTaskItem.speaker)"
                  :alt="currentTaskItem.speaker"
                  class="task-avatar task-avatar--lg"
                />
                <div class="task-identity-line">
                  <strong class="task-speaker">{{
                    currentTaskItem.speaker || '未知角色'
                  }}</strong>
                  <span class="meta-dot" aria-hidden="true">·</span>
                  <span class="task-mode">
                    {{
                      getHistoryVoiceMode(currentTaskItem) === 'reference'
                        ? '参考音频'
                        : '内置音色'
                    }}
                  </span>
                  <template v-if="getCaptionZhLabel(currentTaskItem.caption)">
                    <span class="meta-dot" aria-hidden="true">·</span>
                    <span class="task-tone-highlight">{{
                      getCaptionZhLabel(currentTaskItem.caption)
                    }}</span>
                  </template>
                  <span class="meta-dot" aria-hidden="true">·</span>
                  <time class="task-time tabular">{{
                    formatSentAt(currentTaskItem.sentAt)
                  }}</time>
                </div>
              </div>

              <span
                class="status-indicator"
                :class="
                  playingTaskId === currentTaskItem.taskId
                    ? 'status-indicator--playing'
                    : `status-indicator--${
                        getStatusMeta(currentTaskItem.status?.status).tone
                      }`
                "
              >
                <template v-if="playingTaskId === currentTaskItem.taskId">
                  播放中
                </template>
                <template v-else>
                  {{ getStatusMeta(currentTaskItem.status?.status).label }}
                  <template
                    v-if="isWaitingStatus(currentTaskItem.status?.status)"
                  >
                    · 排队 {{ currentTaskItem.status?.pending ?? 0 }}
                  </template>
                </template>
              </span>
            </div>

            <p
              v-if="currentTaskItem.ttsText.trim()"
              class="task-script"
              lang="ja"
            >
              {{ currentTaskItem.ttsText }}
            </p>
            <p
              v-if="currentTaskItem.caption && currentTaskItem.caption.trim()"
              class="task-caption"
              lang="ja"
            >
              <span class="task-caption-label">语气</span>
              {{ currentTaskItem.caption }}
            </p>
            <p
              v-if="currentTaskItem.status?.error"
              class="inline-notice inline-notice--error"
            >
              <span>{{ currentTaskItem.status.error }}</span>
            </p>

            <div
              v-if="isWaitingStatus(currentTaskItem.status?.status)"
              class="progress-strip"
              role="status"
            >
              <span class="progress-spinner" aria-hidden="true" />
              <span>
                {{
                  currentTaskItem.status?.status === 'running'
                    ? '正在合成语音，通常约 2 秒完成，结果将自动显示在此处…'
                    : `任务已提交，当前排队 ${
                        currentTaskItem.status?.pending ?? 0
                      }，完成后将自动更新…`
                }}
              </span>
            </div>

            <div
              v-if="
                currentTaskItem.status?.status === 'completed' &&
                (resolveTaskUrl(currentTaskItem.status?.save_path_compressed) ||
                  getDownloadLinks(currentTaskItem.status).length)
              "
              class="media-bar"
              :class="{
                'media-bar--playing': playingTaskId === currentTaskItem.taskId,
              }"
            >
              <TtsAudioPlayer
                v-if="
                  resolveTaskUrl(currentTaskItem.status?.save_path_compressed)
                "
                :key="currentTaskItem.taskId"
                :src="
                  resolveTaskUrl(currentTaskItem.status?.save_path_compressed)
                "
                preload="metadata"
                @playing-change="handleCurrentPlayingChange"
              />
              <div
                v-if="getDownloadLinks(currentTaskItem.status).length"
                class="download-row"
              >
                <button
                  v-for="link in getDownloadLinks(currentTaskItem.status)"
                  :key="link.format"
                  type="button"
                  class="download-link"
                  :class="{ 'download-link--expired': link.expired }"
                  :disabled="isDownloading(currentTaskItem.taskId, link.format)"
                  :aria-label="
                    link.expiry
                      ? `下载 ${link.format}，${link.expiry}`
                      : `下载 ${link.format}`
                  "
                  @click="downloadCurrentTtsFile(link)"
                >
                  <span class="download-link-fmt">{{ link.format }}</span>
                  <span
                    v-if="
                      isDownloading(currentTaskItem.taskId, link.format) ||
                      link.expiry
                    "
                    class="download-link-exp tabular"
                  >
                    {{
                      isDownloading(currentTaskItem.taskId, link.format)
                        ? '下载中…'
                        : link.expiry
                    }}
                  </span>
                  <n-icon size="15" aria-hidden="true">
                    <Download />
                  </n-icon>
                </button>
              </div>
            </div>

            <details
              v-if="
                historyAudioPropsMap[currentTaskItem.taskId] ||
                currentTaskItem.referenceText
              "
              class="ref-details"
            >
              <summary>参考音频与原台词</summary>
              <div class="ref-details-body">
                <div
                  v-if="historyAudioPropsMap[currentTaskItem.taskId]"
                  class="ref-details-row"
                >
                  <span class="ref-details-key">参考音频</span>
                  <span class="ref-details-val ref-details-val--audio">
                    <AudioLabel
                      v-bind="historyAudioPropsMap[currentTaskItem.taskId]"
                      :audio-text="currentTaskItem.referenceText"
                      extra-text="点击试听"
                      display-download
                    />
                  </span>
                </div>
                <div
                  v-if="currentTaskItem.referenceText"
                  class="ref-details-row"
                >
                  <span class="ref-details-key">原台词</span>
                  <span class="ref-details-val" lang="ja">{{
                    currentTaskItem.referenceText
                  }}</span>
                </div>
              </div>
            </details>
          </article>
        </div>

        <!-- Deduplicated History Ledger (Compact for Fast A/B Comparison) -->
        <div v-if="visibleHistoryItems.length" class="ledger-section">
          <div class="ledger-section-head">
            <div class="ledger-head-left">
              <h2>{{ currentTaskItem ? '更早的历史记录' : '历史记录' }}</h2>
              <span class="band-meta tabular">
                共 {{ visibleHistoryItems.length }} 条
              </span>
            </div>

            <div class="clear-confirm-group">
              <template v-if="confirmingClearHistory">
                <span class="band-meta">确认清空？</span>
                <button
                  ref="confirmClearBtnRef"
                  type="button"
                  class="text-action text-action--danger"
                  @click="confirmClearHistory"
                >
                  确认
                </button>
                <button
                  type="button"
                  class="text-action"
                  @click="cancelClearHistory"
                >
                  取消
                </button>
              </template>
              <button
                v-else
                ref="askClearBtnRef"
                type="button"
                class="text-action text-action--danger"
                @click="askClearHistory"
              >
                清空历史
              </button>
            </div>
          </div>

          <div class="history-list">
            <article
              v-for="item in visibleHistoryItems"
              :key="item.taskId"
              class="task-entry task-entry--history"
            >
              <div class="task-entry-head">
                <div class="task-identity">
                  <img
                    v-if="item.speaker"
                    :src="getAvatarPath(item.speaker)"
                    :alt="item.speaker"
                    class="task-avatar"
                  />
                  <div class="task-identity-line">
                    <strong class="task-speaker">{{
                      item.speaker || '未知角色'
                    }}</strong>
                    <span class="meta-dot" aria-hidden="true">·</span>
                    <span class="task-mode">
                      {{
                        getHistoryVoiceMode(item) === 'reference'
                          ? '参考音频'
                          : '内置音色'
                      }}
                    </span>
                    <template v-if="getCaptionZhLabel(item.caption)">
                      <span class="meta-dot" aria-hidden="true">·</span>
                      <span class="task-tone-highlight">{{
                        getCaptionZhLabel(item.caption)
                      }}</span>
                    </template>
                    <span class="meta-dot" aria-hidden="true">·</span>
                    <time class="task-time tabular">{{
                      formatSentAt(item.sentAt)
                    }}</time>
                    <template
                      v-if="
                        playingTaskId === item.taskId ||
                        item.status?.status !== 'completed'
                      "
                    >
                      <span class="meta-dot" aria-hidden="true">·</span>
                      <span
                        class="status-indicator"
                        :class="
                          playingTaskId === item.taskId
                            ? 'status-indicator--playing'
                            : `status-indicator--${
                                getStatusMeta(item.status?.status).tone
                              }`
                        "
                      >
                        <template v-if="playingTaskId === item.taskId">
                          播放中
                        </template>
                        <template v-else>
                          {{ getStatusMeta(item.status?.status).label }}
                          <template v-if="isWaitingStatus(item.status?.status)">
                            · 排队 {{ item.status?.pending ?? 0 }}
                          </template>
                        </template>
                      </span>
                    </template>
                  </div>
                </div>

                <div class="task-actions">
                  <button
                    type="button"
                    class="text-action text-action--accent"
                    @click="reuseHistoryItem(item)"
                  >
                    复用参数
                  </button>
                  <button
                    v-if="isWaitingStatus(item.status?.status)"
                    type="button"
                    class="text-action"
                    @click="refreshHistoryStatus(item.taskId)"
                  >
                    刷新
                  </button>
                  <button
                    type="button"
                    class="text-action text-action--danger"
                    @click="removeHistoryItem(item.taskId)"
                  >
                    删除
                  </button>
                </div>
              </div>

              <p v-if="item.ttsText.trim()" class="task-script" lang="ja">
                {{ item.ttsText }}
              </p>
              <p
                v-if="
                  item.caption &&
                  item.caption.trim() &&
                  !getCaptionZhLabel(item.caption)
                "
                class="task-caption"
                lang="ja"
              >
                <span class="task-caption-label">语气</span>
                {{ item.caption }}
              </p>
              <p
                v-if="item.status?.error"
                class="inline-notice inline-notice--error"
              >
                <span>{{ item.status.error }}</span>
              </p>

              <div
                v-if="
                  item.status?.status === 'completed' &&
                  (resolveTaskUrl(item.status?.save_path_compressed) ||
                    getDownloadLinks(item.status).length)
                "
                class="media-bar media-bar--compact"
                :class="{
                  'media-bar--playing': playingTaskId === item.taskId,
                }"
              >
                <TtsAudioPlayer
                  v-if="resolveTaskUrl(item.status?.save_path_compressed)"
                  :src="resolveTaskUrl(item.status?.save_path_compressed)"
                  compact
                  @playing-change="handlePlayingChange(item.taskId, $event)"
                />
                <div
                  v-if="getDownloadLinks(item.status).length"
                  class="download-row"
                >
                  <button
                    v-for="link in getDownloadLinks(item.status)"
                    :key="link.format"
                    type="button"
                    class="download-link download-link--compact"
                    :class="{ 'download-link--expired': link.expired }"
                    :disabled="isDownloading(item.taskId, link.format)"
                    :aria-label="
                      link.expiry
                        ? `下载 ${link.format}，${link.expiry}`
                        : `下载 ${link.format}`
                    "
                    @click="downloadTtsFile(item.taskId, link)"
                  >
                    <span class="download-link-fmt">{{ link.format }}</span>
                    <span
                      v-if="
                        isDownloading(item.taskId, link.format) || link.expiry
                      "
                      class="download-link-exp tabular"
                    >
                      {{
                        isDownloading(item.taskId, link.format)
                          ? '下载中…'
                          : link.expiry
                      }}
                    </span>
                    <n-icon size="14" aria-hidden="true">
                      <Download />
                    </n-icon>
                  </button>
                </div>
              </div>

              <details
                v-if="historyAudioPropsMap[item.taskId] || item.referenceText"
                class="ref-details"
              >
                <summary>参考音频与原台词</summary>
                <div class="ref-details-body">
                  <div
                    v-if="historyAudioPropsMap[item.taskId]"
                    class="ref-details-row"
                  >
                    <span class="ref-details-key">参考音频</span>
                    <span class="ref-details-val ref-details-val--audio">
                      <AudioLabel
                        v-bind="historyAudioPropsMap[item.taskId]"
                        :audio-text="item.referenceText"
                        extra-text="点击试听"
                        display-download
                      />
                    </span>
                  </div>
                  <div v-if="item.referenceText" class="ref-details-row">
                    <span class="ref-details-key">原台词</span>
                    <span class="ref-details-val" lang="ja">{{
                      item.referenceText
                    }}</span>
                  </div>
                </div>
              </details>
            </article>
          </div>
        </div>
      </section>
    </div>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  h,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'
import {
  NConfigProvider,
  NIcon,
  NSelect,
  type GlobalThemeOverrides,
  type SelectGroupOption,
  type SelectInst,
  type SelectOption,
} from 'naive-ui'
import axios from 'axios'
import { ChevronDown, Download, Microphone } from '@vicons/carbon'
import { store } from '../../store'
import { units } from '../../assets/album-index.json'
import { characters, getAvatarPath } from '../../helper/path'
import AudioLabel from '../translate/AudioLabel.vue'
import TtsAudioPlayer from './TtsAudioPlayer.vue'

type VoiceMode = 'embed' | 'reference'
type PresetCategory = 'all' | 'gentle' | 'bright' | 'drama'

type CaptionPreset = {
  category: Exclude<PresetCategory, 'all'>
  quick?: boolean
  shortZh: string
  zh: string
  ja: string
}

type TaskStatus = {
  status: string
  pending: number
  save_path?: string | null
  save_path_compressed?: string | null
  wav_expires_at?: string | null
  ogg_expires_at?: string | null
  error?: string | null
}

type HistoryItem = {
  taskId: string
  sentAt: string
  ttsText: string
  speaker: string
  caption?: string
  voiceMode?: VoiceMode
  referenceText: string
  referenceAudioId: string
  status?: TaskStatus | null
}

type StatusTone = 'pending' | 'running' | 'completed' | 'failed' | 'unknown'

type StatusMeta = {
  label: string
  tone: StatusTone
}

type DownloadLink = {
  format: 'WAV' | 'OGG'
  expiry: string
  expired: boolean
  url: string
  filename: string
}

type PartialFormSnapshot = {
  speaker?: string | null
  referenceAudioId?: string
  referenceText?: string
  captionText?: string
  ttsText?: string
}

type UndoNotice = {
  message: string
  snapshot: PartialFormSnapshot
}

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#bf486b',
    primaryColorHover: '#a33959',
    primaryColorPressed: '#8c2f4b',
    primaryColorSuppl: '#bf486b',
    borderRadius: '10px',
    fontSize: '15px',
    fontSizeMedium: '15px',
  },
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '10px',
        border: '1px solid #d4dfea',
        borderHover: '1px solid #bf486b',
        borderActive: '1px solid #bf486b',
        borderFocus: '1px solid #bf486b',
        boxShadowFocus: '0 0 0 3px rgba(191, 72, 107, 0.14)',
        boxShadowActive: '0 0 0 3px rgba(191, 72, 107, 0.14)',
        heightMedium: '42px',
        fontSizeMedium: '15px',
        textColor: '#1e2a38',
        placeholderColor: '#697788',
      },
      InternalSelectMenu: {
        optionTextColorActive: '#a83b5c',
        optionCheckColor: '#a83b5c',
        optionColorActivePending: '#fdf2f5',
        optionColorPending: '#f5f8fc',
        optionFontSizeMedium: '14px',
      },
    },
  },
}

const PRESET_CATEGORIES: readonly { key: PresetCategory; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'gentle', label: '柔和' },
  { key: 'bright', label: '明快' },
  { key: 'drama', label: '戏剧' },
]

const CAPTION_PRESETS: readonly CaptionPreset[] = [
  {
    category: 'gentle',
    quick: true,
    shortZh: '温柔轻声',
    zh: '温柔平静地轻声交谈',
    ja: '落ち着いた柔らかな口調で、相手を気遣いながら静かに話している。',
  },
  {
    category: 'bright',
    quick: true,
    shortZh: '开心元气',
    zh: '开心明快、元气满满地说话',
    ja: '明るく弾んだ口調で、心から嬉しそうに元気よく話している。',
  },
  {
    category: 'gentle',
    quick: true,
    shortZh: '带着轻笑',
    zh: '带着轻笑、亲切温暖地讲述',
    ja: '小さく柔らかな笑い声を漏らしながら、温かく親しげに語りかけている。',
  },
  {
    category: 'gentle',
    quick: true,
    shortZh: '略带害羞',
    zh: '略带害羞、轻声细语地诉说',
    ja: '少し照れくさそうに息を漏らしながら、控えめな声で優しく話している。',
  },
  {
    category: 'gentle',
    shortZh: '气声耳语',
    zh: '极轻的气声耳语、悄悄叮嘱',
    ja: '息を多めに含ませた控えめな囁き声で、そっと語りかけている。',
  },
  {
    category: 'drama',
    quick: true,
    shortZh: '强忍泪水',
    zh: '强忍泪水、声音微微颤抖',
    ja: '涙を堪えながら声を小さく震わせ、今にも消えそうな音量で話している。',
  },
  {
    category: 'drama',
    shortZh: '压抑怒火',
    zh: '压抑怒火、冷静强硬地开口',
    ja: '怒りを抑えた冷たく強い口調で、語尾を言い切るようにきっぱりと話している。',
  },
  {
    category: 'drama',
    shortZh: '慌张焦急',
    zh: '慌张焦急、语速加快地诉说',
    ja: '息を切らして慌てたように、早口で焦りを滲ませながら必死に話している。',
  },
  {
    category: 'bright',
    quick: true,
    shortZh: '略微傲娇',
    zh: '略微傲娇、嘴硬又带点羞涩',
    ja: '少し照れ隠しながらもツンとした強気な口調で、早口に話している。',
  },
  {
    category: 'gentle',
    shortZh: '困倦迷糊',
    zh: '困倦迷糊、慢悠悠地说着',
    ja: '眠そうに、ぼんやりとゆっくりした口調で話している。',
  },
  {
    category: 'drama',
    shortZh: '疲惫平淡',
    zh: '疲惫无力、平淡低落地开口',
    ja: '疲れ切ったように力を抜いた平坦なトーンで、淡々と話している。',
  },
  {
    category: 'bright',
    shortZh: '舞台呼喊',
    zh: '面向舞台大声热情地呼喊',
    ja: '広い会場に向かって声を張り上げ、全力で明るく元気いっぱいに呼びかけている。',
  },
]

const QUICK_PRESETS = CAPTION_PRESETS.filter((preset) => preset.quick)

const PRESET_JA_TO_SHORT_ZH = new Map(
  CAPTION_PRESETS.map((preset) => [preset.ja, preset.shortZh])
)

// Full-name, Simplified Chinese & common alias search index for all 29 speakers
const SPEAKER_SEARCH_ALIASES: Record<string, string> = {
  真乃: '櫻木真乃 樱木真乃 mano illumination 闪耀',
  灯織: '風野灯織 风野灯织 灯织 hiori illumination 闪耀',
  めぐる: '八宮めぐる 八宫巡 巡 meguru illumination 闪耀',
  恋鐘: '月岡恋鐘 月冈恋钟 恋钟 kogane lantica 安提卡',
  摩美々: '田中摩美々 田中摩美美 摩美美 mamimi lantica 安提卡',
  咲耶: '白瀬咲耶 白濑咲耶 sakuya lantica 安提卡',
  結華: '三峰結華 三峰结华 结华 yuika lantica 安提卡',
  霧子: '幽谷霧子 幽谷雾子 雾子 kiriko lantica 安提卡',
  果穂: '小宮果穂 小宫果穗 果穗 kaho houkago 放课后',
  智代子: '園田智代子 园田智代子 chiyoko choco houkago 放课后',
  樹里: '西城樹里 西城树里 树里 juri houkago 放课后',
  凛世: '杜野凛世 rinze houkago 放课后',
  夏葉: '有栖川夏葉 有栖川夏叶 夏叶 natsuha houkago 放课后',
  甘奈: '大崎甘奈 amana alstroemeria 阿尔斯特罗梅利亚',
  甜花: '大崎甜花 tenka alstroemeria 阿尔斯特罗梅利亚',
  千雪: '桑山千雪 chiyuki alstroemeria 阿尔斯特罗梅利亚',
  あさひ: '芹沢あさひ 芹泽朝日 朝日 asahi straylight 迷光',
  冬優子: '黛冬優子 黛冬优子 冬优子 fuyuko straylight 迷光',
  愛依: '和泉愛依 和泉爱依 爱依 mei straylight 迷光',
  透: '浅倉透 浅仓透 toru noctchill 诺克',
  円香: '樋口円香 樋口圆香 圆香 madoka noctchill 诺克',
  小糸: '福丸小糸 koito noctchill 诺克',
  雛菜: '市川雛菜 市川雏菜 雏菜 hinana noctchill 诺克',
  にちか: '七草にちか 七草日花 日花 nichika shhis 希斯',
  美琴: '緋田美琴 绯田美琴 mikoto shhis 希斯',
  ルカ: '斑鳩ルカ 斑鸠路加 斑鸠露卡 路加 露卡 luca cometik 彗星',
  羽那: '鈴木羽那 铃木羽那 hana cometik 彗星',
  はるき: '郁田はるき 郁田春希 春希 haruki cometik 彗星',
  はづき: '七草はづき 七草叶月 叶月 hazuki 283',
}

const TTS_SERVER = (import.meta.env.VITE_TTS_SERVER ||
  import.meta.env.VITE_GENIE_SERVER) as string | undefined
const ttsBase = TTS_SERVER?.replace(/\/$/, '')

const HISTORY_KEY = 'tts-history'
const HISTORY_LIMIT = 50
const RECENT_SPEAKERS_KEY = 'tts-recent-speakers'
const RECENT_SPEAKERS_LIMIT = 6
const MAX_CONSECUTIVE_POLL_FAILURES = 5

const router = useRouter()
const panelRef = ref<HTMLElement | null>(null)
const ledgerRef = ref<HTMLElement | null>(null)
const speakerControlRef = ref<HTMLElement | null>(null)
const speakerSelectRef = ref<SelectInst | null>(null)
const scriptInputRef = ref<HTMLTextAreaElement | null>(null)
const confirmClearBtnRef = ref<HTMLButtonElement | null>(null)
const askClearBtnRef = ref<HTMLButtonElement | null>(null)

const supportedCharacters = characters.filter(
  (item) => Number(item.id) <= 28 || item.id === '32'
)
const characterOrderMap = new Map(
  supportedCharacters.map((item) => [item.firstName, Number(item.id)])
)
const speakerUnitMap = new Map<string, string>()

const unitEntries = Object.entries(units as Record<string, string[]>)
const orderedUnitEntries = [
  ...unitEntries.filter(([name]) => name !== '283 PRO'),
  ...unitEntries.filter(([name]) => name === '283 PRO'),
]

const speakerGroupOptions: SelectGroupOption[] = orderedUnitEntries
  .map(([rawUnitName, members]) => {
    const unitName = rawUnitName.normalize('NFC')
    const validMembers = members
      .filter((member) => characterOrderMap.has(member))
      .sort(
        (a, b) =>
          (characterOrderMap.get(a) ?? 999) - (characterOrderMap.get(b) ?? 999)
      )
    validMembers.forEach((member) => speakerUnitMap.set(member, unitName))
    return {
      type: 'group' as const,
      label: unitName,
      key: unitName,
      children: validMembers.map((member) => ({
        value: member,
        label: member,
      })),
    }
  })
  .filter((group) => group.children.length > 0)

function filterSpeakerOption(pattern: string, option: SelectOption) {
  const query = pattern.normalize('NFC').trim().toLowerCase()
  if (!query) return true
  const name = String(option.label || option.value || '').normalize('NFC')
  const unitName = speakerUnitMap.get(name) || ''
  const aliases = SPEAKER_SEARCH_ALIASES[name] || ''
  return (
    name.toLowerCase().includes(query) ||
    unitName.toLowerCase().includes(query) ||
    aliases.toLowerCase().includes(query)
  )
}

function renderSpeakerTrigger({ option }: { option: SelectOption }) {
  return String(option.label || option.value || '')
}

function renderSpeakerOption(option: SelectOption | SelectGroupOption) {
  if (option.type === 'group') {
    return h(
      'span',
      {
        style: {
          color: '#556375',
          fontSize: '13px',
          fontWeight: '600',
        },
      },
      String(option.label || '')
    )
  }
  const name = String(option.label || option.value || '')
  const unitName = speakerUnitMap.get(name) || ''
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '0',
      },
    },
    [
      h('img', {
        src: getAvatarPath(name),
        alt: '',
        style: {
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: '0',
        },
      }),
      h(
        'span',
        {
          style: {
            fontWeight: '500',
            flexShrink: '0',
          },
        },
        name
      ),
      unitName
        ? h(
            'span',
            {
              style: {
                color: '#556375',
                fontSize: '13px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
            unitName
          )
        : null,
    ]
  )
}

function loadRecentSpeakers(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_SPEAKERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (name): name is string =>
          typeof name === 'string' && characterOrderMap.has(name)
      )
      .slice(0, RECENT_SPEAKERS_LIMIT)
  } catch {
    return []
  }
}

function persistRecentSpeakers(list: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECENT_SPEAKERS_KEY, JSON.stringify(list))
  } catch {
    // ignore storage quota or privacy mode restrictions
  }
}

const recentSpeakers = ref<string[]>(loadRecentSpeakers())
const selectedSpeaker = ref<string | null>(recentSpeakers.value[0] || null)
const referenceAudioId = ref('')
const referenceText = ref('')
const captionText = ref('')
const ttsText = ref('')

const presetsOpen = ref(false)
const activePresetCategory = ref<PresetCategory>('all')
const confirmingClearHistory = ref(false)
const undoNotice = ref<UndoNotice | null>(null)
const downloadingKeys = ref<Record<string, boolean>>({})
const playingTaskId = ref('')
const justCompletedTaskId = ref('')
let readyHighlightTimer: number | null = null
let lastInternalStoreRef: typeof store.ttsReference = null
let hasInternalStoreRef = false
let consecutivePollFailures = 0

const submitting = ref(false)
const errorMessage = ref('')
const activeTaskId = ref('')
const historyItems = ref<HistoryItem[]>([])

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function recordRecentSpeaker(name: string | null) {
  if (!name || !characterOrderMap.has(name)) return
  const next = [
    name,
    ...recentSpeakers.value.filter((item) => item !== name),
  ].slice(0, RECENT_SPEAKERS_LIMIT)
  recentSpeakers.value = next
  persistRecentSpeakers(next)
}

function captureVoiceSnapshot(): PartialFormSnapshot {
  return {
    speaker: selectedSpeaker.value,
    referenceAudioId: referenceAudioId.value,
    referenceText: referenceText.value,
  }
}

function captureFullSnapshot(): PartialFormSnapshot {
  return {
    speaker: selectedSpeaker.value,
    referenceAudioId: referenceAudioId.value,
    referenceText: referenceText.value,
    captionText: captionText.value,
    ttsText: ttsText.value,
  }
}

function showUndoNotice(message: string, snapshot: PartialFormSnapshot) {
  undoNotice.value = { message, snapshot }
}

function dismissUndoNotice() {
  undoNotice.value = null
}

function syncStoreReference(
  next: { speaker: string; text: string; audioId: string } | null
) {
  store.ttsReference = next
  lastInternalStoreRef = store.ttsReference
  hasInternalStoreRef = true
}

function applyUndoNotice() {
  const notice = undoNotice.value
  if (!notice) return
  const snap = notice.snapshot
  if (snap.speaker !== undefined) {
    selectedSpeaker.value = snap.speaker
  }
  if (snap.referenceAudioId !== undefined) {
    if (snap.referenceAudioId) {
      syncStoreReference({
        speaker: snap.speaker || selectedSpeaker.value || '',
        text: snap.referenceText || '',
        audioId: snap.referenceAudioId,
      })
      referenceAudioId.value = snap.referenceAudioId
      referenceText.value = snap.referenceText || ''
    } else {
      syncStoreReference(null)
      referenceAudioId.value = ''
      referenceText.value = ''
    }
  }
  if (snap.captionText !== undefined) {
    captionText.value = snap.captionText
  }
  if (snap.ttsText !== undefined) {
    ttsText.value = snap.ttsText
  }
  undoNotice.value = null
}

const selectedSpeakerUnit = computed(() =>
  selectedSpeaker.value ? speakerUnitMap.get(selectedSpeaker.value) || '' : ''
)

const matchedCaptionPreset = computed(() => {
  const normalized = captionText.value.trim()
  if (!normalized) return null
  return CAPTION_PRESETS.find((preset) => preset.ja === normalized) || null
})

function getCaptionZhLabel(caption?: string) {
  if (!caption) return ''
  return PRESET_JA_TO_SHORT_ZH.get(caption.trim()) || ''
}

const filteredPresets = computed(() => {
  if (activePresetCategory.value === 'all') return CAPTION_PRESETS
  return CAPTION_PRESETS.filter(
    (preset) => preset.category === activePresetCategory.value
  )
})

const currentTaskItem = computed(() => {
  if (!activeTaskId.value) return null
  return (
    historyItems.value.find((item) => item.taskId === activeTaskId.value) ||
    null
  )
})

const visibleHistoryItems = computed(() => {
  if (!currentTaskItem.value) return historyItems.value
  return historyItems.value.filter(
    (item) => item.taskId !== currentTaskItem.value?.taskId
  )
})

const waitingTaskCount = computed(
  () =>
    historyItems.value.filter((item) => isWaitingStatus(item.status?.status))
      .length
)

const missingFieldGuide = computed(() => {
  if (!ttsBase) return null
  if (!selectedSpeaker.value) {
    return { field: 'speaker' as const, label: '先选择角色 →' }
  }
  if (!ttsText.value.trim()) {
    return { field: 'script' as const, label: '先输入日文台词 →' }
  }
  return null
})

function focusMissingField() {
  if (!missingFieldGuide.value) return
  if (missingFieldGuide.value.field === 'speaker') {
    const input = speakerControlRef.value?.querySelector('input')
    if (input) {
      input.focus()
      input.click()
    } else {
      speakerSelectRef.value?.focus()
    }
    return
  }
  scriptInputRef.value?.focus()
}

function handlePlayingChange(taskIdValue: string, playing: boolean) {
  if (playing) {
    playingTaskId.value = taskIdValue
  } else if (playingTaskId.value === taskIdValue) {
    playingTaskId.value = ''
  }
}

function handleCurrentPlayingChange(playing: boolean) {
  if (currentTaskItem.value) {
    handlePlayingChange(currentTaskItem.value.taskId, playing)
  } else if (!playing) {
    playingTaskId.value = ''
  }
}

watch(activeTaskId, (_, prev) => {
  if (prev && playingTaskId.value === prev) {
    playingTaskId.value = ''
  }
})

function clearReadyHighlight() {
  if (readyHighlightTimer) {
    window.clearTimeout(readyHighlightTimer)
    readyHighlightTimer = null
  }
  justCompletedTaskId.value = ''
}

function pulseJustCompleted(taskIdValue: string) {
  justCompletedTaskId.value = taskIdValue
  if (readyHighlightTimer) {
    window.clearTimeout(readyHighlightTimer)
  }
  readyHighlightTimer = window.setTimeout(() => {
    if (justCompletedTaskId.value === taskIdValue) {
      justCompletedTaskId.value = ''
    }
    readyHighlightTimer = null
  }, 1500)
}

async function scrollLedgerIntoViewIfHidden() {
  await nextTick()
  const el = ledgerRef.value
  if (!el || typeof window === 'undefined') return
  const rect = el.getBoundingClientRect()
  if (rect.top > window.innerHeight - 140 || rect.top < 0) {
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'nearest',
    })
  }
}

const historyAudioPropsMap = computed(() =>
  historyItems.value.reduce<Record<string, { id: string; base: string }>>(
    (acc, item) => {
      const props = getAudioProps(item.referenceAudioId)
      if (props) {
        acc[item.taskId] = props
      }
      return acc
    },
    {}
  )
)

const pollIntervalMs = 2000
let pollTimer: number | null = null
const inFlightTaskIds = new Set<string>()

const reference = computed(() => store.ttsReference)

watch(
  reference,
  (value) => {
    if (hasInternalStoreRef && value === lastInternalStoreRef) {
      hasInternalStoreRef = false
      return
    }
    hasInternalStoreRef = false
    dismissUndoNotice()
    if (value) {
      if (value.speaker) {
        selectedSpeaker.value = value.speaker
        recordRecentSpeaker(value.speaker)
      }
      referenceAudioId.value = value.audioId || ''
      referenceText.value = value.text || ''
    } else {
      referenceAudioId.value = ''
      referenceText.value = ''
    }
  },
  { immediate: true }
)

function clearReferenceSilent() {
  referenceAudioId.value = ''
  referenceText.value = ''
  syncStoreReference(null)
}

function clearReferenceWithUndo() {
  const snapshot = captureVoiceSnapshot()
  clearReferenceSilent()
  showUndoNotice('已恢复当前角色内置音色。', snapshot)
}

function handleSpeakerChange(value: string | null) {
  const previous = selectedSpeaker.value
  if (value === previous) return
  if (referenceAudioId.value) {
    const snapshot = captureVoiceSnapshot()
    selectedSpeaker.value = value
    recordRecentSpeaker(value)
    clearReferenceSilent()
    showUndoNotice(
      `已切换为 ${value || '新角色'} 内置音色，并自动清除原参考音频。`,
      snapshot
    )
    return
  }
  dismissUndoNotice()
  selectedSpeaker.value = value
  recordRecentSpeaker(value)
}

function goToVoiceSearch() {
  router.push({ path: '/search' })
}

function toggleQuickPreset(jaCaption: string) {
  captionText.value = captionText.value.trim() === jaCaption ? '' : jaCaption
}

function selectCaptionPreset(jaCaption: string) {
  if (captionText.value.trim() === jaCaption) {
    captionText.value = ''
    return
  }
  captionText.value = jaCaption
  presetsOpen.value = false
}

function handleScriptKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    if (canSubmit.value) {
      createTask()
    }
  }
}

function getAudioProps(audioId?: string): { id: string; base: string } | null {
  if (!audioId) return null
  const parts = audioId.split('/')
  if (parts.length < 3) return null
  return {
    id: parts[2],
    base: `${parts[0]}/${parts[1]}`,
  }
}

const referenceAudioProps = computed(() =>
  getAudioProps(referenceAudioId.value)
)

const hasReferenceAudio = computed(() => !!referenceAudioId.value.trim())

const JAPANESE_KANA_RE = /[\u3040-\u309f\u30a0-\u30ff]/

const showNonJapaneseCaptionHint = computed(() => {
  const value = captionText.value.trim()
  return value.length > 0 && !JAPANESE_KANA_RE.test(value)
})

const canSubmit = computed(() => {
  return (
    !!ttsBase &&
    !!selectedSpeaker.value &&
    ttsText.value.trim().length > 0 &&
    !submitting.value
  )
})

function getHistoryVoiceMode(item: HistoryItem): VoiceMode {
  if (item.voiceMode) return item.voiceMode
  return item.referenceAudioId ? 'reference' : 'embed'
}

function resolveTaskUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  if (!ttsBase) return path
  const needsSlash = !path.startsWith('/')
  return `${ttsBase}${needsSlash ? '/' : ''}${path}`
}

const DAY_MS = 24 * 60 * 60 * 1000

function getExpiry(expiresAt?: string | null) {
  if (!expiresAt) {
    return { expiry: '', expired: false }
  }
  const timestamp = Date.parse(expiresAt)
  if (!Number.isFinite(timestamp)) {
    return { expiry: '', expired: false }
  }
  const remainingMs = timestamp - Date.now()
  if (remainingMs <= 0) {
    return { expiry: '已过期', expired: true }
  }
  return {
    expiry: `剩余 ${Math.ceil(remainingMs / DAY_MS)} 天`,
    expired: false,
  }
}

function getDownloadLinks(status?: TaskStatus | null) {
  if (!status) return []
  const links: DownloadLink[] = []
  const raw = status.save_path
  const compressed = status.save_path_compressed

  const rawUrl = resolveTaskUrl(raw)
  if (rawUrl) {
    links.push({
      format: 'WAV',
      ...getExpiry(status.wav_expires_at),
      url: rawUrl,
      filename: raw ? raw.split('/').pop() || 'tts.wav' : 'tts.wav',
    })
  }

  const compressedUrlValue = resolveTaskUrl(compressed)
  if (compressedUrlValue) {
    links.push({
      format: 'OGG',
      ...getExpiry(status.ogg_expires_at),
      url: compressedUrlValue,
      filename: compressed
        ? compressed.split('/').pop() || 'tts.ogg'
        : 'tts.ogg',
    })
  }

  return links
}

function isDownloading(taskIdValue: string, format: string) {
  return !!downloadingKeys.value[`${taskIdValue}:${format}`]
}

async function triggerDownload(url: string, filename: string) {
  if (typeof window === 'undefined') return
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('download failed')
    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank')
  }
}

async function downloadTtsFile(taskIdValue: string, link: DownloadLink) {
  if (!link.url) return
  const key = `${taskIdValue}:${link.format}`
  if (downloadingKeys.value[key]) return
  downloadingKeys.value = { ...downloadingKeys.value, [key]: true }
  try {
    await triggerDownload(link.url, link.filename)
  } finally {
    const next = { ...downloadingKeys.value }
    delete next[key]
    downloadingKeys.value = next
  }
}

function toErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    if (status === 429) {
      return '请求过于频繁或已达到今日生成限额，请稍后再试。'
    }
    if (status === 503) {
      return '当前排队任务已满，请稍后再试。'
    }
    if (status === 422) {
      const detail = error.response?.data?.detail
      return typeof detail === 'string' && detail.trim()
        ? `参数校验失败：${detail}`
        : '输入参数无效，请检查角色与生成文本。'
    }
    if (status === 404) {
      return '任务不存在或已过期。'
    }
    if (status && status >= 500) {
      return 'TTS 服务暂时不可用，请稍后再试。'
    }
    return error.message || fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

function loadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistoryItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, HISTORY_LIMIT)
  } catch {
    return []
  }
}

function persistHistory(items: HistoryItem[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  } catch {
    // ignore storage quota or privacy mode restrictions
  }
}

function addHistoryItem(item: HistoryItem) {
  const next = [item, ...historyItems.value].slice(0, HISTORY_LIMIT)
  historyItems.value = next
  persistHistory(next)
}

function updateHistoryItem(taskIdValue: string, status: TaskStatus) {
  const prev = historyItems.value.find((item) => item.taskId === taskIdValue)
  const wasWaiting = isWaitingStatus(prev?.status?.status)
  const next = historyItems.value.map((item) =>
    item.taskId === taskIdValue ? { ...item, status } : item
  )
  historyItems.value = next
  persistHistory(next)
  if (
    wasWaiting &&
    status.status === 'completed' &&
    activeTaskId.value === taskIdValue
  ) {
    pulseJustCompleted(taskIdValue)
  }
}

async function refreshHistoryStatus(
  taskIdValue: string,
  surfaceError = false
): Promise<boolean> {
  if (!ttsBase || inFlightTaskIds.has(taskIdValue)) return true
  inFlightTaskIds.add(taskIdValue)
  try {
    const response = await axios.get(`${ttsBase}/tasks/${taskIdValue}`)
    updateHistoryItem(taskIdValue, response.data as TaskStatus)
    return true
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      updateHistoryItem(taskIdValue, {
        status: 'failed',
        pending: 0,
        error: '任务不存在或已过期。',
      })
      return true
    }
    if (surfaceError && activeTaskId.value === taskIdValue) {
      errorMessage.value = toErrorMessage(error, '查询失败')
    }
    return false
  } finally {
    inFlightTaskIds.delete(taskIdValue)
  }
}

function reuseHistoryItem(item: HistoryItem) {
  const snapshot = captureFullSnapshot()
  const hadDraft =
    (snapshot.ttsText || '').trim().length > 0 ||
    (snapshot.captionText || '').trim().length > 0 ||
    (snapshot.referenceAudioId || '').length > 0

  selectedSpeaker.value = item.speaker || null
  recordRecentSpeaker(item.speaker || null)
  if (item.referenceAudioId) {
    syncStoreReference({
      speaker: item.speaker,
      text: item.referenceText || '',
      audioId: item.referenceAudioId,
    })
    referenceAudioId.value = item.referenceAudioId
    referenceText.value = item.referenceText || ''
  } else {
    syncStoreReference(null)
    referenceAudioId.value = ''
    referenceText.value = ''
  }
  captionText.value = item.caption || ''
  ttsText.value = item.ttsText || ''
  activePresetCategory.value = 'all'
  errorMessage.value = ''
  if (hadDraft) {
    showUndoNotice(`已复用 ${item.speaker || '历史任务'} 的参数。`, snapshot)
  } else {
    dismissUndoNotice()
  }
  panelRef.value?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  })
}

function removeHistoryItem(taskIdValue: string) {
  const next = historyItems.value.filter((item) => item.taskId !== taskIdValue)
  historyItems.value = next
  persistHistory(next)
  if (activeTaskId.value === taskIdValue) {
    activeTaskId.value = ''
  }
  if (playingTaskId.value === taskIdValue) {
    playingTaskId.value = ''
  }
  if (visibleHistoryItems.value.length === 0) {
    confirmingClearHistory.value = false
  }
  if (waitingTaskCount.value === 0) {
    stopPolling()
  }
}

function refreshCurrentTask() {
  if (currentTaskItem.value) {
    consecutivePollFailures = 0
    refreshHistoryStatus(currentTaskItem.value.taskId, true)
  }
}

function reuseCurrentTask() {
  if (currentTaskItem.value) {
    reuseHistoryItem(currentTaskItem.value)
  }
}

function removeCurrentTask() {
  if (currentTaskItem.value) {
    removeHistoryItem(currentTaskItem.value.taskId)
  }
}

function downloadCurrentTtsFile(link: DownloadLink) {
  if (currentTaskItem.value) {
    downloadTtsFile(currentTaskItem.value.taskId, link)
  }
}

async function askClearHistory() {
  confirmingClearHistory.value = true
  await nextTick()
  confirmClearBtnRef.value?.focus()
}

async function cancelClearHistory() {
  confirmingClearHistory.value = false
  await nextTick()
  askClearBtnRef.value?.focus()
}

function confirmClearHistory() {
  confirmingClearHistory.value = false
  if (currentTaskItem.value) {
    const currentOnly = historyItems.value.filter(
      (item) => item.taskId === currentTaskItem.value?.taskId
    )
    historyItems.value = currentOnly
    persistHistory(currentOnly)
    if (
      playingTaskId.value &&
      playingTaskId.value !== currentTaskItem.value.taskId
    ) {
      playingTaskId.value = ''
    }
    if (waitingTaskCount.value === 0) {
      stopPolling()
    }
    return
  }
  historyItems.value = []
  persistHistory([])
  playingTaskId.value = ''
  stopPolling()
}

function formatSentAt(value?: Date | string | null) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isWaitingStatus(status?: string) {
  return ['pending', 'running'].includes(status || '')
}

function getStatusMeta(status?: string): StatusMeta {
  if (status === 'pending') {
    return { label: '等待中', tone: 'pending' }
  }
  if (status === 'running') {
    return { label: '生成中', tone: 'running' }
  }
  if (status === 'completed') {
    return { label: '已完成', tone: 'completed' }
  }
  if (status === 'failed' || status === 'error') {
    return { label: '生成失败', tone: 'failed' }
  }
  return { label: '未知状态', tone: 'unknown' }
}

async function pollWaitingTasks() {
  const waitingIds = historyItems.value
    .filter((item) => isWaitingStatus(item.status?.status))
    .map((item) => item.taskId)

  if (!waitingIds.length) {
    stopPolling()
    return
  }

  const results = await Promise.all(
    waitingIds.map((id) => refreshHistoryStatus(id, id === activeTaskId.value))
  )

  if (results.every((ok) => !ok)) {
    consecutivePollFailures += 1
    if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
      stopPolling()
      return
    }
  } else {
    consecutivePollFailures = 0
  }

  if (waitingTaskCount.value === 0) {
    stopPolling()
  }
}

function ensurePolling() {
  if (!ttsBase || waitingTaskCount.value === 0) {
    stopPolling()
    return
  }
  if (!pollTimer) {
    pollTimer = window.setInterval(pollWaitingTasks, pollIntervalMs)
  }
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

async function createTask() {
  if (!selectedSpeaker.value || !ttsBase) return
  const normalizedText = ttsText.value.trim()
  if (!normalizedText) return

  submitting.value = true
  errorMessage.value = ''
  dismissUndoNotice()
  presetsOpen.value = false
  confirmingClearHistory.value = false
  consecutivePollFailures = 0

  const normalizedCaption = captionText.value.trim()
  const activeReferenceId = referenceAudioId.value.trim()
  const activeReferenceText = activeReferenceId ? referenceText.value : ''
  const mode: VoiceMode = activeReferenceId ? 'reference' : 'embed'

  const payload: Record<string, string> = {
    character_name: selectedSpeaker.value,
    reference_audio_id: activeReferenceId,
    reference_audio_text: activeReferenceText,
    text: normalizedText,
  }
  if (normalizedCaption) {
    payload.caption = normalizedCaption
  }

  try {
    const response = await axios.post(`${ttsBase}/tasks`, payload)
    const createdId = response.data.task_id as string
    activeTaskId.value = createdId
    recordRecentSpeaker(selectedSpeaker.value)
    addHistoryItem({
      taskId: createdId,
      sentAt: new Date().toISOString(),
      ttsText: normalizedText,
      speaker: selectedSpeaker.value,
      caption: normalizedCaption,
      voiceMode: mode,
      referenceText: activeReferenceText,
      referenceAudioId: activeReferenceId,
      status: { status: 'pending', pending: 0 },
    })
    ensurePolling()
    pollWaitingTasks()
    scrollLedgerIntoViewIfHidden()
  } catch (error: unknown) {
    errorMessage.value = toErrorMessage(error, '请求失败')
  } finally {
    submitting.value = false
  }
}

historyItems.value = loadHistory()

if (recentSpeakers.value.length === 0 && historyItems.value.length > 0) {
  const fromHistory: string[] = []
  for (const item of historyItems.value) {
    if (
      item.speaker &&
      characterOrderMap.has(item.speaker) &&
      !fromHistory.includes(item.speaker)
    ) {
      fromHistory.push(item.speaker)
      if (fromHistory.length >= RECENT_SPEAKERS_LIMIT) break
    }
  }
  if (fromHistory.length) {
    recentSpeakers.value = fromHistory
    persistRecentSpeakers(fromHistory)
    if (!selectedSpeaker.value) {
      selectedSpeaker.value = fromHistory[0]
    }
  }
}

function resumePollingIfNeeded() {
  if (waitingTaskCount.value > 0 && ttsBase) {
    consecutivePollFailures = 0
    ensurePolling()
    pollWaitingTasks()
  }
}

onMounted(() => {
  resumePollingIfNeeded()
})

onActivated(() => {
  resumePollingIfNeeded()
})

onDeactivated(() => {
  stopPolling()
  clearReadyHighlight()
})

onBeforeUnmount(() => {
  stopPolling()
  clearReadyHighlight()
})
</script>

<style scoped>
/* Design tokens aligned with sc-viewer-v2 (App.vue / HomePage.vue) */
.tts-studio {
  --tts-accent: #bf486b;
  --tts-accent-text: #a83b5c;
  --tts-accent-hover: #963250;
  --tts-accent-soft: #fdf2f5;
  --tts-accent-border: rgba(191, 72, 107, 0.34);
  --tts-surface: rgba(255, 255, 255, 0.9);
  --tts-tint: rgba(245, 249, 253, 0.85);
  --tts-border: rgba(205, 218, 230, 0.92);
  --tts-hairline: #dce5ef;
  --tts-ink: #1e2a38;
  --tts-muted: #556375;

  /* Strict 3-size body scale (H1 exempt; zero < 13px text) */
  --tts-fs-heading: 1rem;
  --tts-fs-body: 0.9375rem;
  --tts-fs-sm: 0.8125rem;

  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 0 36px;
  color: var(--tts-ink);
  font-family: HummingStd-E, UDKakugo_SmallPr6-B, 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
  text-align: left;
}

.tts-studio button {
  margin: 0;
  font-family: inherit;
}

.tts-studio button:focus:not(:focus-visible) {
  outline: none;
}

.tabular {
  font-variant-numeric: tabular-nums;
}

/* Unified Frosted Sheets */
.studio-sheet,
.ledger-sheet {
  overflow: hidden;
  border: 1px solid var(--tts-border);
  border-radius: 18px;
  background: var(--tts-surface);
  box-shadow: 0 14px 36px rgba(62, 83, 105, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Direct Opening Masthead */
.studio-masthead {
  padding: 20px 28px 16px;
  border-bottom: 1px solid var(--tts-hairline);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96),
    rgba(246, 250, 253, 0.72)
  );
}

.studio-masthead h1 {
  margin: 0;
  color: var(--tts-ink);
  font-size: clamp(1.5rem, 2.4vw, 1.875rem);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.studio-masthead p {
  margin: 5px 0 0;
  max-width: 62ch;
  color: var(--tts-muted);
  font-size: var(--tts-fs-body);
  line-height: 1.5;
}

/* Hairline-Divided Bands Inside the Studio Sheet */
.studio-band {
  padding: 20px 28px;
  border-bottom: 1px solid var(--tts-hairline);
}

.studio-band--script {
  padding-top: 18px;
}

.studio-band--direction {
  background: var(--tts-tint);
}

.band-head {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}

.band-head-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: baseline;
}

.direction-head-actions {
  display: inline-flex;
  gap: 14px;
  align-items: center;
}

.band-head h2,
.band-heading-label,
.ledger-section-head h2 {
  margin: 0;
  color: var(--tts-ink);
  font-size: var(--tts-fs-heading);
  font-weight: 700;
  line-height: 1.35;
}

.optional-label {
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  font-weight: 500;
}

.band-meta {
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  line-height: 1.5;
}

/* Voice Identity Row & Frameless Recent Speakers Strip */
.voice-picker-row {
  display: flex;
  gap: 14px;
  align-items: center;
}

.voice-avatar-frame {
  display: grid;
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  padding: 2px;
  box-sizing: border-box;
  place-items: center;
  overflow: hidden;
  border: 1.5px solid var(--tts-hairline);
  border-radius: 50%;
  background: #ffffff;
  transition: border-color 180ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.voice-avatar-frame--active {
  border-color: rgba(191, 72, 107, 0.5);
  box-shadow: 0 2px 10px rgba(191, 72, 107, 0.14);
}

.voice-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.voice-avatar-icon {
  color: var(--tts-muted);
}

.voice-picker-control {
  flex: 1;
  min-width: 0;
}

.speaker-select {
  width: 100%;
}

.recent-speakers {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  margin-top: 10px;
}

.recent-speakers-label {
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  font-weight: 600;
  white-space: nowrap;
}

.recent-speakers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.recent-speaker-item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 32px;
  padding: 2px 10px 2px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--tts-ink);
  font-size: var(--tts-fs-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 140ms cubic-bezier(0.22, 1, 0.36, 1),
    color 140ms cubic-bezier(0.22, 1, 0.36, 1);
}

.recent-speaker-item:hover {
  background: #f1f6fb;
}

.recent-speaker-item--active {
  background: var(--tts-accent-soft);
  color: var(--tts-accent-text);
  font-weight: 600;
}

.recent-speaker-item:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: 2px;
}

.recent-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
}

.voice-mode-note {
  margin: 10px 0 0;
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  line-height: 1.55;
}

.reference-strip {
  margin-top: 12px;
  padding: 12px 16px;
  border-left: 3px solid var(--tts-accent);
  border-radius: 0 10px 10px 0;
  background: var(--tts-tint);
}

.reference-strip-top {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  justify-content: space-between;
}

.reference-audio-wrap {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  color: var(--tts-ink);
  font-size: var(--tts-fs-sm);
}

.reference-label {
  color: var(--tts-muted);
  font-weight: 600;
}

.reference-mode-explain {
  margin: 6px 0 0;
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  line-height: 1.5;
}

.reference-transcript {
  margin: 8px 0 0;
  padding-top: 8px;
  border-top: 1px solid var(--tts-hairline);
  color: var(--tts-ink);
  font-size: var(--tts-fs-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.reference-transcript-prefix {
  margin-right: 8px;
  color: var(--tts-muted);
  font-weight: 600;
}

/* Textareas */
.studio-textarea {
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #cfdbe7;
  border-radius: 10px;
  background: #ffffff;
  color: var(--tts-ink);
  font-family: inherit;
  font-size: var(--tts-fs-body);
  line-height: 1.65;
  resize: vertical;
  transition: border-color 160ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1);
}

.studio-textarea::placeholder {
  color: #697788;
}

.studio-textarea:hover {
  border-color: #b4c4d6;
}

.studio-textarea:focus {
  outline: none;
  border-color: var(--tts-accent);
  box-shadow: 0 0 0 3px rgba(191, 72, 107, 0.14);
}

.studio-textarea--script {
  min-height: 98px;
}

.studio-textarea--caption {
  min-height: 62px;
}

/* Compact Quick-Preset Bar (Always Discoverable) */
.quick-preset-bar {
  margin-top: 10px;
}

.quick-preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.quick-preset-btn {
  min-height: 32px;
  padding: 0 11px;
  border: 1px solid #d5e0eb;
  border-radius: 8px;
  background: #ffffff;
  color: var(--tts-ink);
  font-size: var(--tts-fs-sm);
  font-weight: 500;
  cursor: pointer;
  transition: border-color 140ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 140ms cubic-bezier(0.22, 1, 0.36, 1),
    color 140ms cubic-bezier(0.22, 1, 0.36, 1);
}

.quick-preset-btn:hover {
  border-color: var(--tts-accent-border);
  background: var(--tts-accent-soft);
  color: var(--tts-accent-text);
}

.quick-preset-btn--active {
  border-color: var(--tts-accent);
  background: var(--tts-accent-soft);
  color: var(--tts-accent-text);
  font-weight: 600;
}

.quick-preset-btn:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: 2px;
}

.preset-expand-trigger {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  white-space: nowrap;
}

.chevron-icon {
  transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
}

.chevron-icon--open {
  transform: rotate(180deg);
}

/* Form Footer Directly Above Output */
.studio-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: rgba(255, 255, 255, 0.96);
}

.composer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
}

.primary-cta {
  min-width: 136px;
  min-height: 42px;
  padding: 0 24px;
  border: 0;
  border-radius: 10px;
  background: var(--tts-accent);
  color: #ffffff;
  font-size: var(--tts-fs-body);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 160ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 160ms cubic-bezier(0.22, 1, 0.36, 1);
}

.primary-cta:hover:not(:disabled) {
  background: var(--tts-accent-hover);
  box-shadow: 0 6px 18px rgba(191, 72, 107, 0.24);
}

.primary-cta:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: 2px;
}

.primary-cta:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.missing-guide-btn {
  padding: 6px 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #925205;
  font-size: var(--tts-fs-sm);
  font-weight: 600;
  cursor: pointer;
  transition: color 140ms cubic-bezier(0.22, 1, 0.36, 1);
}

.missing-guide-btn:hover {
  color: var(--tts-accent-text);
}

.missing-guide-btn:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: 2px;
}

.waiting-summary {
  color: #1d4ed8;
  font-size: var(--tts-fs-sm);
  font-weight: 600;
}

.composer-summary {
  margin: 0;
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  line-height: 1.5;
}

/* Text Actions & Inline Links */
.text-action,
.inline-link {
  padding: 4px 2px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  font-weight: 600;
  line-height: 1.4;
  cursor: pointer;
  transition: color 140ms cubic-bezier(0.22, 1, 0.36, 1);
}

.inline-link {
  padding: 0;
  color: var(--tts-accent-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.text-action:hover,
.inline-link:hover {
  color: var(--tts-accent-text);
}

.text-action--accent {
  color: var(--tts-accent-text);
}

.text-action--accent:hover {
  color: var(--tts-accent-hover);
}

.text-action--warn {
  color: #925205;
}

.text-action--warn:hover {
  color: #703e03;
}

.text-action--danger {
  color: #b4233b;
}

.text-action--danger:hover {
  color: #8f1a2d;
}

.text-action:focus-visible,
.inline-link:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: 2px;
}

/* Inline Notices & Undo Strip */
.inline-notice {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 0;
  padding: 10px 14px;
  border-left: 3px solid transparent;
  border-radius: 0 8px 8px 0;
  font-size: var(--tts-fs-sm);
  line-height: 1.55;
}

.inline-notice--warn {
  border-left-color: #c27803;
  background: #fef7e8;
  color: #7a4b00;
}

.inline-notice--info {
  border-left-color: var(--tts-accent);
  background: var(--tts-accent-soft);
  color: var(--tts-ink);
}

.inline-notice--error {
  border-left-color: #c81e3a;
  background: #fdf2f4;
  color: #9b162d;
}

.inline-notice-actions {
  display: inline-flex;
  gap: 12px;
  align-items: center;
}

.studio-sheet > .inline-notice {
  margin: 0;
  border-bottom: 1px solid var(--tts-hairline);
  border-radius: 0;
  padding: 11px 28px;
}

.studio-sheet-error {
  border-top: 1px solid var(--tts-hairline);
  border-bottom: 0;
}

/* Collapsible Full Bilingual Preset Drawer */
.preset-block {
  margin-top: 14px;
}

.preset-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.segmented-tabs {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #cfdbe7;
  border-radius: 9px;
  background: #ffffff;
}

.segmented-tab {
  min-height: 32px;
  padding: 0 14px;
  border: 0;
  border-right: 1px solid #e2eaf2;
  border-radius: 0;
  background: transparent;
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.segmented-tab:last-child {
  border-right: 0;
}

.segmented-tab:hover {
  background: #f5f8fc;
  color: var(--tts-ink);
}

.segmented-tab--active {
  background: var(--tts-accent-soft);
  color: var(--tts-accent-text);
}

.segmented-tab:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: -2px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--tts-hairline);
  border-radius: 12px;
  background: var(--tts-hairline);
  gap: 1px;
}

.preset-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 12px 15px;
  border: 0;
  border-radius: 0;
  background: #ffffff;
  color: var(--tts-ink);
  text-align: left;
  cursor: pointer;
  transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.preset-cell:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.preset-cell:hover {
  background: #f8fbfe;
}

.preset-cell--active {
  background: var(--tts-accent-soft);
  box-shadow: inset 3px 0 0 var(--tts-accent);
}

.preset-cell:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: -2px;
}

.preset-cell-zh {
  color: var(--tts-ink);
  font-size: var(--tts-fs-body);
  font-weight: 600;
  line-height: 1.4;
}

.preset-cell--active .preset-cell-zh {
  color: var(--tts-accent-text);
}

.preset-cell-ja {
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  line-height: 1.45;
}

/* Output & History Ledger Sheet */
.ledger-section {
  padding: 20px 28px;
  border-bottom: 1px solid var(--tts-hairline);
  background-color: transparent;
  transition: background-color 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.ledger-section:last-child {
  border-bottom: 0;
}

.ledger-section--current {
  background-color: rgba(253, 242, 245, 0.28);
}

.ledger-section--just-ready {
  background-color: rgba(253, 242, 245, 0.85);
}

.ledger-section-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.ledger-head-left,
.clear-confirm-group {
  display: flex;
  gap: 12px;
  align-items: baseline;
}

.history-list {
  display: flex;
  flex-direction: column;
}

.task-entry {
  padding: 16px 0;
  border-top: 1px solid var(--tts-hairline);
}

.task-entry--current,
.history-list > .task-entry:first-child {
  padding-top: 0;
  border-top: 0;
}

.history-list > .task-entry:last-child {
  padding-bottom: 0;
}

.task-entry-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  justify-content: space-between;
}

.task-identity {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.task-avatar {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
}

.task-avatar--lg {
  width: 32px;
  height: 32px;
}

.task-identity-line {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
  min-width: 0;
  font-size: var(--tts-fs-sm);
}

.task-speaker {
  color: var(--tts-ink);
  font-size: var(--tts-fs-body);
  font-weight: 700;
}

.task-tone-highlight {
  color: var(--tts-accent-text);
  font-weight: 600;
}

.task-mode,
.task-time,
.meta-dot {
  color: var(--tts-muted);
}

.status-indicator {
  font-size: var(--tts-fs-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.status-indicator--completed {
  color: #15803d;
}

.status-indicator--playing {
  color: var(--tts-accent-text);
}

.status-indicator--pending {
  color: #925205;
}

.status-indicator--running {
  color: #1d4ed8;
}

.status-indicator--failed {
  color: #c81e3a;
}

.status-indicator--unknown {
  color: var(--tts-muted);
}

.task-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 0 0 auto;
}

.task-script {
  margin: 10px 0 0;
  color: var(--tts-ink);
  font-size: var(--tts-fs-body);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.task-caption {
  margin: 6px 0 0;
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.task-caption-label {
  margin-right: 8px;
  font-weight: 600;
}

/* Waiting Progress Strip With Subtle Spinner */
.progress-strip {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--tts-tint);
  color: var(--tts-ink);
  font-size: var(--tts-fs-sm);
  font-variant-numeric: tabular-nums;
}

.progress-spinner {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(191, 72, 107, 0.22);
  border-top-color: var(--tts-accent);
  border-radius: 50%;
  animation: tts-spin 750ms linear infinite;
}

@keyframes tts-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Integrated Audio + Download Bar (Playing State Highlights for A/B Comparison) */
.media-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 12px 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: var(--tts-tint);
  transition: background-color 180ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

.media-bar--compact {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 10px;
}

.media-bar--playing {
  border-color: var(--tts-accent-border);
  background: var(--tts-accent-soft);
}

.download-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.download-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #d4dfea;
  border-radius: 9px;
  background: #ffffff;
  color: var(--tts-ink);
  font-size: var(--tts-fs-sm);
  cursor: pointer;
  transition: border-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
    color 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.download-link--compact {
  min-height: 32px;
  padding: 0 10px;
}

.download-link:hover:not(:disabled) {
  border-color: var(--tts-accent-border);
  color: var(--tts-accent-text);
}

.download-link:focus-visible {
  outline: 2px solid var(--tts-accent);
  outline-offset: 2px;
}

.download-link:disabled {
  opacity: 0.6;
  cursor: wait;
}

.download-link--expired {
  border-style: dashed;
  border-color: #c8d5e3;
  background: rgba(255, 255, 255, 0.65);
  color: var(--tts-muted);
}

.download-link-fmt {
  font-weight: 700;
}

.download-link-exp {
  color: var(--tts-muted);
}

/* Reference Details Disclosure */
.ref-details {
  margin-top: 8px;
}

.ref-details summary {
  width: max-content;
  padding: 4px 0;
  color: var(--tts-muted);
  font-size: var(--tts-fs-sm);
  font-weight: 600;
  cursor: pointer;
}

.ref-details[open] summary {
  color: var(--tts-ink);
}

.ref-details-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  padding: 10px 14px;
  border-left: 2px solid var(--tts-hairline);
  background: var(--tts-tint);
}

.ref-details-row {
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr);
  gap: 10px;
  font-size: var(--tts-fs-sm);
  line-height: 1.55;
}

.ref-details-key {
  color: var(--tts-muted);
  font-weight: 600;
}

.ref-details-val {
  color: var(--tts-ink);
  overflow-wrap: anywhere;
}

.ref-details-val--audio {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

/* Responsive: Tablet & Mobile */
@media (max-width: 768px) {
  .studio-masthead,
  .studio-band,
  .studio-footer,
  .ledger-section {
    padding: 18px 18px;
  }

  .studio-sheet > .inline-notice {
    padding: 11px 18px;
  }

  .preset-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .tts-studio {
    gap: 14px;
    padding: 0 0 24px;
  }

  .studio-sheet,
  .ledger-sheet {
    border-radius: 14px;
  }

  .studio-masthead,
  .studio-band,
  .studio-footer,
  .ledger-section {
    padding: 16px 14px;
  }

  .studio-sheet > .inline-notice {
    padding: 10px 14px;
  }

  .voice-avatar-frame {
    width: 42px;
    height: 42px;
  }

  .text-action {
    min-height: 36px;
    padding: 6px 4px;
  }

  .studio-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .composer-actions {
    width: 100%;
  }

  .primary-cta {
    flex: 1;
  }

  .segmented-tabs {
    width: 100%;
  }

  .segmented-tab {
    flex: 1;
    padding: 0 8px;
  }

  .media-bar {
    align-items: stretch;
    flex-direction: column;
    padding: 12px;
  }

  .download-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
    width: 100%;
  }

  .download-link {
    justify-content: center;
  }

  .task-entry-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .task-actions {
    padding-top: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .voice-avatar-frame,
  .recent-speaker-item,
  .studio-textarea,
  .quick-preset-btn,
  .chevron-icon,
  .primary-cta,
  .missing-guide-btn,
  .text-action,
  .inline-link,
  .segmented-tab,
  .preset-cell,
  .ledger-section,
  .media-bar,
  .download-link {
    transition: none;
  }

  .progress-spinner {
    animation: none;
    border-color: var(--tts-accent);
  }
}
</style>
