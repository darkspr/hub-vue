import { defineStore } from "pinia";
import { store } from "@/store";

export const devicesStore = defineStore({
  id: "tab-key",
  state: () => ({
       // 存储tab
       activeKey: "1",
       defaultCheckedList: JSON.parse(localStorage.getItem('checklist') || '["state","domain","token_id","brand","abi","sdk","comment"]'),
       deviceDomain: ""
  }),
  actions: {
     changeactiveKey(val:string) {
         this.activeKey = val;
      },
      changeCheckedList(val:any) {
        localStorage.setItem('checklist', JSON.stringify(val));
        this.defaultCheckedList = val
      },
      setDeviceDomain(val:string) {
         this.deviceDomain = val;
      }
  }
});

export function systemStoreHook() {
  return devicesStore(store);
}



  