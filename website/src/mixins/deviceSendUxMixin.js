const SEND_BUSY_MESSAGE = "姝ｅ湪浼犺緭涓紝璇风瓑寰呭畬鎴?";"
const SEND_DISCONNECTED_MESSAGE = "璁惧鏈繛鎺?";"
const SEND_SUCCESS_MESSAGE = "宸插彂閫佸埌璁惧";
const SEND_FAILURE_PREFIX = "鍙戦€佸け璐ワ細";
const SEND_OVERLAY_TITLE = "姝ｅ湪鍙戦€佸埌璁惧...";
const SEND_OVERLAY_TIP = "璇蜂繚鎸佽繛鎺ョǔ瀹氾紝瀹屾垚鍚庝細鑷姩鎭㈠浜や簰";

function resolveSendErrorMessage(error) {
  if (error && typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }

  return "鏈煡閿欒";
}

export default {
  data() {
    return {
      isSending: false,
      isToastVisible: false,
      isSendPreviewFrozen: false,
      sendOverlayTitle: SEND_OVERLAY_TITLE,
      sendOverlayTip: SEND_OVERLAY_TIP,
    };
  },

  computed: {
    shouldShowSendingSnapshot() {
      return this.isSendPreviewFrozen;
    },
  },

  methods: {
    ensureSendPreviewSnapshot() {
      if (this.isSendPreviewFrozen) {
        return;
      }

      if (typeof this.captureSendingPreview === "function") {
        this.captureSendingPreview();
      }

      this.isSendPreviewFrozen = true;
    },

    prepareSendToastUi() {
      this.sendOverlayTitle = SEND_OVERLAY_TITLE;
      this.sendOverlayTip = SEND_OVERLAY_TIP;
      this.ensureSendPreviewSnapshot();
    },

    beginSendUi() {
      this.prepareSendToastUi();
      this.isSending = true;
    },

    endSendUi() {
      this.isSending = false;
      if (!this.isToastVisible) {
        this.releaseSendingSnapshot();
      }
    },

    handleToastShow() {
      this.isToastVisible = true;
    },

    handleToastHide() {
      this.isToastVisible = false;
      if (!this.isSending) {
        this.releaseSendingSnapshot();
      }
    },

    releaseSendingSnapshot() {
      if (!this.isSendPreviewFrozen) {
        return;
      }

      this.isSendPreviewFrozen = false;
      if (typeof this.clearSendingPreview === "function") {
        this.clearSendingPreview();
      }
    },

    guardBeforeSend(
      connected,
      disconnectedMessage = SEND_DISCONNECTED_MESSAGE,
      disconnectedType = "error",
    ) {
      if (this.isSending) {
        if (this.toast && typeof this.toast.showInfo === "function") {
          this.toast.showInfo(SEND_BUSY_MESSAGE);
        }
        return false;
      }

      if (!connected) {
        this.prepareSendToastUi();

        if (
          disconnectedType === "info" &&
          this.toast &&
          typeof this.toast.showInfo === "function"
        ) {
          this.toast.showInfo(disconnectedMessage);
          return false;
        }

        if (this.toast && typeof this.toast.showError === "function") {
          this.toast.showError(disconnectedMessage);
        }
        return false;
      }

      return true;
    },

    showSendSuccess(message = SEND_SUCCESS_MESSAGE) {
      if (this.toast && typeof this.toast.showSuccess === "function") {
        this.toast.showSuccess(message);
      }
    },

    showSendFailure(error) {
      if (this.toast && typeof this.toast.showError === "function") {
        this.toast.showError(
          `${SEND_FAILURE_PREFIX}${resolveSendErrorMessage(error)}`,
        );
      }
    },
  },
};
