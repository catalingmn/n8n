<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';
import { useTelemetry } from '@/composables/useTelemetry';
import { useAssistantStore } from '@/stores/assistant.store';
import { useWorkflowsStore } from '@/stores/workflows.store';
import AssistantAvatar from 'n8n-design-system/components/AskAssistantAvatar/AssistantAvatar.vue';
import AskAssistantButton from 'n8n-design-system/components/AskAssistantButton/AskAssistantButton.vue';
import { computed } from 'vue';

const assistantStore = useAssistantStore();
const i18n = useI18n();
const telemetry = useTelemetry();
const workflowStore = useWorkflowsStore();

const lastUnread = computed(() => {
	const msg = assistantStore.lastUnread;
	if (msg?.type === 'block') {
		return msg.title;
	}
	if (msg?.type === 'text') {
		return msg.content;
	}
	if (msg?.type === 'code-diff') {
		return msg.description;
	}
	return '';
});

const onClick = () => {
	assistantStore.openChat();
	telemetry.track(
		'User opened assistant',
		{
			source: 'canvas',
			task: 'placeholder',
			has_existing_session: !assistantStore.isSessionEnded,
			workflow_id: workflowStore.workflowId,
		},
		{ withPostHog: true },
	);
};
</script>

<template>
	<div
		v-if="assistantStore.canShowAssistantButtons && !assistantStore.isAssistantOpen"
		:class="$style.container"
	>
		<n8n-tooltip
			:z-index="4000"
			placement="top"
			:visible="!!lastUnread"
			:popper-class="$style.tooltip"
		>
			<template #content>
				<div :class="$style.text">{{ lastUnread }}</div>
				<div :class="$style.assistant">
					<AssistantAvatar size="mini" />
					<span>{{ i18n.baseText('aiAssistant.name') }}</span>
				</div>
			</template>
			<AskAssistantButton :unread-count="assistantStore.unreadCount" @click="onClick" />
		</n8n-tooltip>
	</div>
</template>

<style lang="scss" module>
.container {
	position: absolute;
	bottom: var(--spacing-s);
	right: var(--spacing-s);
	z-index: 3000;
}

.tooltip {
	min-width: 150px;
	max-width: 265px !important;
	line-height: normal;
}

.assistant {
	font-size: var(--font-size-3xs);
	line-height: var(--spacing-s);
	font-weight: var(--font-weight-bold);
	margin-top: var(--spacing-xs);
	> span {
		margin-left: var(--spacing-4xs);
	}
}

.text {
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2; /* number of lines to show */
	line-clamp: 2;
	-webkit-box-orient: vertical;
}
</style>
