<template>
   <BaseContextMenu
      :context-event="contextEvent"
      @close-context="$emit('close-context')"
   >
      <div
         v-if="isPinned"
         class="context-element"
         @click="unpin"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-pin-off text-light pr-1" /> {{ t('word.unpin') }}</span>
      </div>
      <div
         v-else
         class="context-element"
         @click="pin"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-pin mdi-rotate-45 text-light pr-1" /> {{ t('word.pin') }}</span>
      </div>
      <div
         v-if="isConnected"
         class="context-element"
         @click="disconnect"
      >
         <span class="d-flex"><i class="mdi mdi-18px mdi-power text-light pr-1" /> {{ t('word.disconnect') }}</span>
      </div>
      <div class="context-element" @click="duplicateConnection">
         <span class="d-flex"><i class="mdi mdi-18px mdi-content-duplicate text-light pr-1" /> {{ t('word.duplicate') }}</span>
      </div>
      <div class="context-element" @click="showConfirmModal">
         <span class="d-flex"><i class="mdi mdi-18px mdi-delete text-light pr-1" /> {{ t('word.delete') }}</span>
      </div>

      <ConfirmModal
         v-if="isConfirmModal"
         @confirm="confirmDeleteConnection"
         @hide="hideConfirmModal"
      >
         <template #header>
            <div class="d-flex">
               <i class="mdi mdi-24px mdi-server-remove mr-1" /> {{ t('message.deleteConnection') }}
            </div>
         </template>
         <template #body>
            <div class="mb-2">
               {{ t('message.deleteCorfirm') }} <b>{{ connectionName }}</b>?
            </div>
         </template>
      </ConfirmModal>
   </BaseContextMenu>
</template>

<script setup lang="ts">
import { computed, Prop, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { uidGen } from 'common/libs/uidGen';
import { useI18n } from 'vue-i18n';
import { useConnectionsStore } from '@/stores/connections';
import { useWorkspacesStore } from '@/stores/workspaces';
import BaseContextMenu from '@/components/BaseContextMenu.vue';
import ConfirmModal from '@/components/BaseConfirmModal.vue';
import { ConnectionParams } from 'common/interfaces/antares';

const { t } = useI18n();

const connectionsStore = useConnectionsStore();

const {
   getConnectionName,
   addConnection,
   deleteConnection,
   pinConnection,
   unpinConnection
} = connectionsStore;

const { pinnedConnections } = storeToRefs(connectionsStore);

const workspacesStore = useWorkspacesStore();
const { getSelected: selectedWorkspace } = storeToRefs(workspacesStore);

const {
   selectWorkspace,
   removeConnected: disconnectWorkspace,
   getWorkspace
} = workspacesStore;

const props = defineProps({
   contextEvent: MouseEvent,
   contextConnection: Object as Prop<ConnectionParams>
});

const emit = defineEmits(['close-context']);

const isConfirmModal = ref(false);

const connectionName = computed(() => getConnectionName(props.contextConnection.uid));
const isConnected = computed(() => getWorkspace(props.contextConnection.uid).connectionStatus === 'connected');
const isPinned = computed(() => pinnedConnections.value.has(props.contextConnection.uid));

const confirmDeleteConnection = () => {
   if (selectedWorkspace.value === props.contextConnection.uid)
      selectWorkspace(null);
   deleteConnection(props.contextConnection);
   closeContext();
};

const duplicateConnection = () => {
   let connectionCopy = Object.assign({}, props.contextConnection);
   connectionCopy = {
      ...connectionCopy,
      uid: uidGen('C'),
      name: connectionCopy.name ? `${connectionCopy?.name}_copy` : ''
   };

   addConnection(connectionCopy);
   closeContext();
};

const showConfirmModal = () => {
   isConfirmModal.value = true;
};

const hideConfirmModal = () => {
   isConfirmModal.value = false;
   closeContext();
};

const pin = () => {
   pinConnection(props.contextConnection.uid);
   closeContext();
};

const unpin = () => {
   unpinConnection(props.contextConnection.uid);
   closeContext();
};

const disconnect = () => {
   disconnectWorkspace(props.contextConnection.uid);
   closeContext();
};

const closeContext = () => {
   emit('close-context');
};
</script>
