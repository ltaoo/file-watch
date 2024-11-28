/**
 * @file 用户登录
 */
import { Button, Input } from "@/components/ui";
import { ButtonCore, InputCore } from "@/domains/ui";
import { ViewComponent } from "@/store/types";

export const LoginPage: ViewComponent = (props) => {
  const { app, view } = props;
  const emailInput = new InputCore({
    defaultValue: "",
    placeholder: "请输入邮箱",
    onChange(v) {
      app.$user.inputEmail(v);
    },
  });
  const passwordInput = new InputCore({
    defaultValue: "",
    type: "password",
    placeholder: "请输入密码",
    onChange(v) {
      app.$user.inputPassword(v);
    },
  });
  const loginBtn = new ButtonCore({
    async onClick() {
      loginBtn.setLoading(true);
      await app.$user.login();
      loginBtn.setLoading(false);
    },
  });

  // view.onShow(() => {
  //   if (!app.user.needRegister) {
  //     return;
  //   }
  // });

  return (
    <div class="flex justify-center items-center h-screen bg-[#f8f9fa]">
      <form>
        <div class="p-12 rounded-xl w-[480px] bg-white">
          <h1 class="text-4xl text-center">管理后台登录</h1>
          <div class="mt-16">
            <Input store={emailInput} />
          </div>
          <div class="mt-4">
            <Input store={passwordInput} />
          </div>
          <div class="grid grid-cols-1 mt-4">
            <Button store={loginBtn} size="default">
              登录
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
