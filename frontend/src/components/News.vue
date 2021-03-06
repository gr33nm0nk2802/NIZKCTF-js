<template>
  <md-content>
    <md-toolbar md-elevation="1">
      <span class="md-title">{{ $t("news") }}</span>
    </md-toolbar>
    <md-content v-if="firstLoad" class="spinner">
      <md-progress-spinner md-mode="indeterminate" />
    </md-content>
    <md-content v-else class="container md-scrollbar">
      <transition-group name="list">
        <p v-for="item in loadedNews" v-bind:key="item.datetime">
          <span class="item-date">[{{ item.date }}]</span>
          {{ item.text }}
        </p>
      </transition-group>
    </md-content>
  </md-content>
</template>

<script>
import fromUnixTime from "date-fns/fromUnixTime";
import { mapState, mapActions } from "vuex";

import { API } from "@/services/api";
import { createPolling } from "@/utils";

export default {
  name: "News",
  data: () => ({
    loadedNews: [],
    firstLoad: true
  }),
  created() {
    this.newsPolling = createPolling(this.loadNews);
    this.newsPolling.start();
  },
  computed: {
    ...mapState({
      news: state => state.news
    })
  },
  methods: {
    ...mapActions(["setNewsFromPolling"]),
    fillNews() {
      const datas = [...this.news]
        .sort((a, b) => b.time - a.time)
        .map(item => ({
          datetime: item.time,
          date: fromUnixTime(item.time).toLocaleString(),
          text: item.msg
        }));

      this.loadedNews = datas;
    },
    loadNews() {
      API.listNews()
        .then(response => this.setNewsFromPolling(response.data))
        .catch(err => {
          if (err.response && err.response.status === 404) {
            this.setNewsFromPolling([]);
          }
        })
        .finally(() => (this.firstLoad = false));
    }
  },
  beforeDestroy() {
    this.newsPolling.stop();
  },
  watch: {
    news() {
      this.fillNews();
    }
  }
};
</script>

<style type="sass" scoped>
.container {
  padding-left: 16px;
  padding-right: 16px;
  overflow: scroll;
  height: 70vh;
}

.spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
}

.md-list-item-text p {
  white-space: normal;
}

.item-date {
  font-weight: bold;
}

.list-enter-active,
.list-leave-active {
  transition: all 2s;
}

.list-enter,
.list-leave-to {
  opacity: 0;
  background-color: yellow;
  transform: translateY(30px);
}
</style>
