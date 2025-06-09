import { useState } from "react";
import { get, post } from "@/lib/request";
import { TelegramUser } from "@/lib/telegram-auth";
import { toast } from "sonner";

export function useUserActions() {
  const [loading, setLoading] = useState(false);

  /**
   * 检查用户是否存在
   * @param user Telegram用户信息
   * @returns 用户信息
   */
  const checkUser = async (user: TelegramUser) => {
    console.log("=== 🔍 checkUser 开始 ===");
    console.log("📝 输入参数:", {
      hasUser: !!user,
      userId: user?.id,
      userName: user?.first_name,
    });

    if (!user) {
      console.error("❌ user 参数为空");
      toast.error("❌ 用户参数为空");
      return null;
    }

    setLoading(true);

    try {
      const apiUrl = `/api/user/telegram/${user.id}`;
      console.log("🌐 尝试获取现有用户:", apiUrl);
      toast.info(`🔍 查询用户 ${user.id}...`);

      const startTime = Date.now();
      const data = await get(apiUrl);
      const duration = Date.now() - startTime;

      console.log("📡 获取用户请求完成:", {
        duration: `${duration}ms`,
        hasData: !!data,
        data: data,
      });

      if (!data) {
        console.log("👤 用户不存在，创建新用户");
        toast.info("👤 用户不存在，正在创建...");

        const newUser = await addUser(user);
        console.log("🆕 新用户创建结果:", {
          success: !!newUser,
          newUser: newUser,
        });

        if (newUser) {
          toast.success(`✅ 新用户创建成功: ${newUser.firstName}`);
        } else {
          toast.error("❌ 新用户创建失败");
        }

        return newUser;
      }

      console.log("✅ 找到现有用户:", data);
      toast.success(`✅ 找到用户: ${data.firstName}`);
      return data;
    } catch (error) {
      console.error("💥 checkUser 出错:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMsg = error instanceof Error ? error.message : "获取用户失败";
      toast.error(`💥 获取用户失败: ${errorMsg}`);

      // 如果获取失败，尝试创建新用户
      console.log("🔄 获取失败，尝试创建新用户");
      toast.info("🔄 尝试创建新用户...");

      try {
        const newUser = await addUser(user);
        console.log("🆕 备用创建用户结果:", {
          success: !!newUser,
          newUser: newUser,
        });

        if (newUser) {
          toast.success(`✅ 备用创建成功: ${newUser.firstName}`);
        } else {
          toast.error("❌ 备用创建也失败");
        }

        return newUser;
      } catch (addError) {
        console.error("💥 创建用户也失败:", addError);
        const addErrorMsg =
          addError instanceof Error ? addError.message : "创建用户失败";
        toast.error(`💥 创建用户失败: ${addErrorMsg}`);
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 添加用户
   * @param user 用户信息
   * @returns 用户信息
   */
  const addUser = async (user: TelegramUser) => {
    console.log("=== 🆕 addUser 开始 ===");
    console.log("📝 创建用户参数:", {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
    });

    setLoading(true);

    try {
      const payload = {
        user: {
          telegramId: String(user.id),
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          username: user.username || "",
        },
      };

      console.log("🌐 发送创建用户请求:", payload);
      toast.info("🆕 正在创建用户...");

      const startTime = Date.now();
      const data = await post(`/api/user/add`, payload);
      const duration = Date.now() - startTime;

      console.log("📡 创建用户请求完成:", {
        duration: `${duration}ms`,
        success: !!data,
        data: data,
      });

      if (data) {
        toast.success(`✅ 用户创建成功 (${duration}ms)`);
      } else {
        toast.error("❌ 创建用户返回空数据");
      }

      return data;
    } catch (error) {
      console.error("💥 addUser 出错:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMsg = error instanceof Error ? error.message : "创建用户失败";
      toast.error(`💥 创建用户失败: ${errorMsg}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { checkUser, addUser, loading };
}
