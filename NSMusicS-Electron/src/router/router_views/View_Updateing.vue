<script setup lang="ts">
import { onMounted } from 'vue'
import Table_Updateing from '@/views/view_app/music_components/update_list/Table_Updateing.vue'
import { store_router_data_info } from '@/router/router_store/store_router_data_info'

onMounted(async () => {
  store_router_data_info.router_select = 'update'
})
</script>
<template>
  <div class="view_show">
    <Table_Updateing />
  </div>
</template>
<style>
.view_show {
  width: 100vw;
  height: calc(100vh - 200px);
}
</style>
