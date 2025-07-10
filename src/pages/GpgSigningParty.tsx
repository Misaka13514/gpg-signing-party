import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, ChevronDown, ChevronRight, Github } from "lucide-react";

interface FormValues {
  myFingerprint: string;
  keyserver: string;
  localUser: string;
  uids: string[];
  certLevel: string;
  commandMode: "manual" | "auto";
  outputMode: "export" | "upload";
  hasGnuPG: boolean;
  hasPrivateKey: boolean;
  understandsPublicConsequences: boolean;
  understandsNoRealName: boolean;
  understandsSigningImpact: boolean;
}

interface CommandStep {
  title: string;
  command?: string;
  commands?: string[];
  example: string;
}

const UID_OPTIONS = [
  "Misaka13514 <Misaka13514@gmail.com>",
  "Misaka_0x34ca <admin@atri.tk>",
  "Misaka_0x34ca <admin@apeiria.net>",
];
const CERT_OPTIONS = [
  { value: "0", label: "我不作答。（默认）" },
  { value: "1", label: "我根本没有检查过。" },
  { value: "2", label: "我随意检查过。" },
  { value: "3", label: "我非常小心地检查过。" },
];

const CommandStepCard = React.memo(function CommandStepCard({
  step,
}: {
  step: CommandStep;
}) {
  const [showExample, setShowExample] = useState(true);
  const copyCommand = useCallback((cmd: string) => {
    navigator.clipboard.writeText(cmd);
  }, []);

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{step.title}</h3>
        </div>

        {step.command && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">命令:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyCommand(step.command!)}
                className="h-8 px-2 text-xs hover:bg-gray-100"
              >
                <Copy className="h-4 w-4 mr-1" />
                复制
              </Button>
            </div>
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto border">
              {step.command}
            </pre>
          </div>
        )}

        {step.commands && (
          <div className="mb-4">
            <span className="text-sm font-medium mb-2 block">命令:</span>
            <div className="space-y-3">
              {step.commands.map((cmd, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600 font-medium">
                      命令 {idx + 1}:
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCommand(cmd)}
                      className="h-8 px-2 text-xs hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      复制
                    </Button>
                  </div>
                  <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto border">
                    {cmd}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExample((v) => !v)}
            className="text-sm mb-2 p-0 h-auto font-medium flex items-center hover:bg-transparent hover:text-blue-600"
          >
            {showExample ? (
              <ChevronDown className="mr-1 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-1 h-4 w-4" />
            )}
            示例输出
          </Button>
          {showExample && (
            <pre className="bg-green-50 border border-green-200 p-3 rounded-md text-sm overflow-x-auto">
              {step.example}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default function GpgSigningParty() {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      myFingerprint: "293B93D8A471059F85D716A65BA92099D9BE2DAA",
      keyserver: "keyserver.ubuntu.com",
      localUser: "",
      uids: UID_OPTIONS,
      certLevel: "0",
      commandMode: "manual",
      outputMode: "export",
      hasGnuPG: false,
      hasPrivateKey: false,
      understandsPublicConsequences: false,
      understandsNoRealName: false,
      understandsSigningImpact: false,
    },
  });
  const [commands, setCommands] = useState<CommandStep[]>([]);
  const commandsRef = useRef<HTMLDivElement>(null);

  const watched = watch([
    "hasGnuPG",
    "hasPrivateKey",
    "understandsPublicConsequences",
    "understandsNoRealName",
    "understandsSigningImpact",
    "localUser",
    "uids",
  ]) as [boolean, boolean, boolean, boolean, boolean, string, string[]];
  const [
    hasGnuPG,
    hasPrivateKey,
    understandsPublicConsequences,
    understandsNoRealName,
    understandsSigningImpact,
    localUser,
    uids,
  ] = watched;

  const checklistComplete =
    hasGnuPG &&
    hasPrivateKey &&
    understandsPublicConsequences &&
    understandsNoRealName &&
    understandsSigningImpact;
  const formComplete =
    checklistComplete && localUser.trim().length > 0 && uids.length > 0;

  useEffect(() => {
    if (commands.length > 0) {
      commandsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [commands]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      if (!checklistComplete) {
        alert("请完成所有检查项后再继续");
        return;
      }
      if (!data.localUser.trim() || data.uids.length === 0) {
        alert("请填写完整信息");
        return;
      }

      const {
        myFingerprint,
        keyserver,
        localUser,
        uids,
        certLevel,
        commandMode,
        outputMode,
      } = data;

      const generateSignCommand = () => {
        if (commandMode === "auto") {
          const all = uids.length === UID_OPTIONS.length;
          if (all) {
            return `echo -e "y\\n${certLevel}\\ny\\nsave" | gpg --command-fd=0 --local-user ${localUser} --sign-key --ask-cert-level ${myFingerprint}`;
          } else {
            const nums = uids
              .map((u) => UID_OPTIONS.indexOf(u) + 1)
              .join("\\n");
            return `echo -e "N\\n${nums}\\nsign\\n${certLevel}\\ny\\nsave" | gpg --command-fd=0 --local-user ${localUser} --sign-key --ask-cert-level ${myFingerprint}`;
          }
        }
        return `gpg --local-user ${localUser} --sign-key --ask-cert-level ${myFingerprint}`;
      };

      const steps: CommandStep[] = [
        {
          title: "1. 获取密钥及所有签名",
          command: `gpg --keyserver ${keyserver} --keyserver-options no-self-sigs-only --recv-keys ${myFingerprint}`,
          example: `gpg: 密钥 ${myFingerprint.slice(-16)}: 公钥 “${
            UID_OPTIONS[0]
          }” 已导入
gpg: 处理的总数：1
gpg:               已导入：1`,
        },
        {
          title: "2. 对选定 UID 签名",
          command: generateSignCommand(),
          example: `pub  ed25519/${myFingerprint.slice(-16)}
     创建于：2023-01-01  有效至：2030-01-01  可用于：SC  
     信任度：未知        有效性：未知
sub  cv25519/6B71F8EC272CFDCF
     创建于：2023-01-01  有效至：2030-01-01  可用于：E   
sub  ed25519/FB305A6788613226
     创建于：2023-01-01  有效至：2030-01-01  可用于：A   
sub  ed25519/B4F6D57F0FC9507E
     创建于：2023-01-01  有效至：2030-01-01  可用于：S   
[ 未知 ] (1). ${UID_OPTIONS[0]}
[ 未知 ] (2)  ${UID_OPTIONS[1]}
[ 未知 ] (3)  ${UID_OPTIONS[2]}

${
  uids.length === UID_OPTIONS.length
    ? `真的要签名所有的用户标识吗？(y/N) y`
    : `真的要签名所有的用户标识吗？(y/N) N
提示：选择用户标识以签名

${uids.map((uid) => `gpg> ${UID_OPTIONS.indexOf(uid) + 1}`).join("\n")}
gpg> sign`
}

pub  ed25519/${myFingerprint.slice(-16)}
     创建于：2023-01-01  有效至：2030-01-01  可用于：SC  
     信任度：未知        有效性：未知
 主密钥指纹： 293B 93D8 A471 059F 85D7  16A6 5BA9 2099 D9BE 2DAA

     ${uids.map((uid) => `${uid}`).join("\n     ")}

这个密钥将在 2030-01-01 过期。
您有多仔细地检查过您正要签名的密钥确实属于具有以上名字的人呢？
如果您不知道这个问题的答案，请输入“0”。

   (0) 我不作答。  (default)
   (1) 我根本没有检查过。 
   (2) 我随意检查过。 
   (3) 我非常小心地检查过。 

您的选择是？（输入‘?’以获得更多的信息）： ${certLevel}
您真的确定要签名这个密钥，使用您的密钥
“Your Name <your@email>” (${localUser})

真的要签名吗？(y/N) y

gpg> save`,
        },
        {
          title: "3. 查看本地签名状态",
          command: `gpg --list-sigs ${myFingerprint}`,
          example: (() => {
            const dateStr = new Date().toISOString().split("T")[0];
            const header = [
              `pub   ed25519 2023-01-01 [SC] [有效至：2030-01-01]`,
              `      ${myFingerprint}`,
            ];
            const uidLines = UID_OPTIONS.map((uid) => {
              if (uids.includes(uid)) {
                const levelSig =
                  certLevel === "0"
                    ? "sig          "
                    : `sig ${certLevel}        `;
                return [
                  `uid             [ 完全 ] ${uid}`,
                  `sig 3        ${myFingerprint.slice(
                    -16
                  )} 2023-01-01  [自签名]`,
                  `${levelSig}${localUser} ${dateStr}  Your Name <your@email>`,
                ].join("\n");
              } else {
                return [
                  `uid             [ 未知 ] ${uid}`,
                  `sig 3        ${myFingerprint.slice(
                    -16
                  )} 2023-01-01  [自签名]`,
                ].join("\n");
              }
            });
            const subs = [
              `sub   cv25519 2023-01-01 [E] [有效至：2030-01-01]`,
              `sig          ${myFingerprint.slice(-16)} 2023-01-01  [自签名]`,
              `sub   ed25519 2023-01-01 [A] [有效至：2030-01-01]`,
              `sig          ${myFingerprint.slice(-16)} 2023-01-01  [自签名]`,
              `sub   ed25519 2023-01-01 [S] [有效至：2030-01-01]`,
              `sig          ${myFingerprint.slice(-16)} 2023-01-01  [自签名]`,
            ];
            return [...header, ...uidLines, ...subs].join("\n");
          })(),
        },
        {
          title: "4. 导出或上传签名",
          command:
            outputMode === "upload"
              ? `gpg --keyserver ${keyserver} --send-keys ${myFingerprint.slice(
                  -16
                )}`
              : `gpg --export --armor --output sig-${myFingerprint.slice(
                  -8
                )}.asc ${myFingerprint}`,
          example:
            outputMode === "upload"
              ? `gpg: 正在发送密钥 ${myFingerprint.slice(
                  -16
                )} 到 ${keyserver}
gpg: 成功发送密钥`
              : `# 已将所有签名导出到 sig-${myFingerprint.slice(
                  -8
                )}.asc 文件中`,
        },
        {
          title: "5. 完成后续操作",
          command:
            outputMode === "upload"
              ? `xdg-open "https://${keyserver}/pks/lookup?op=vindex&search=0x${myFingerprint.toLowerCase()}"`
              : `thunderbird # 请将 sig-${myFingerprint.slice(
                  -8
                )}.asc 文件通过邮件发送给我`,
          example:
            outputMode === "upload"
              ? `# 浏览器将打开公钥服务器页面，您可以在其中查看是否上传成功`
              : `# 不要忘记在邮件中添加附件`,
        },
      ];

      setCommands(steps);
    },
    [checklistComplete]
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* 我的信息 */}
      <section id="my-info">
        <Card className="mb-4">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">我的信息</h2>

            <div className="mb-4">
              <label className="block mb-2 font-medium">
                我的 GPG 密钥指纹
              </label>
              <Controller
                name="myFingerprint"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    readOnly
                    className="bg-gray-100 font-mono text-sm"
                  />
                )}
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium">公钥服务器</label>
              <Controller
                name="keyserver"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    readOnly
                    className="bg-gray-100 font-mono text-sm"
                  />
                )}
              />
            </div>

            <div className="mb-4">
              <h3 className="font-medium mb-2">我的 UID</h3>
              <ul className="ml-4 space-y-1 text-sm list-disc list-outside">
                {UID_OPTIONS.map((uid, index) => (
                  <li key={index} className="font-mono text-gray-700">
                    {uid}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">我的证明</h3>
              <div className="text-sm space-y-2">
                <div>
                  <p className="font-medium">对于名称：</p>
                  <ul className="ml-4 mt-2 space-y-1 text-gray-700 list-disc list-outside">
                    <li>
                      <a
                        href="https://github.com/Misaka13514"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Misaka13514 @ GitHub
                      </a>
                      ，在该页面上公开了我的 GPG 公钥指纹。
                    </li>
                    <li>
                      <a
                        href="https://aur.archlinux.org/account/Misaka13514"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Misaka13514 @ AUR
                      </a>
                      ，在该页面上公开了我的 GPG 公钥指纹（查看需要登录 AUR
                      账号）。
                    </li>
                    <li>
                      <a
                        href="https://t.me/Misaka_0x34ca"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Misaka_0x34ca @ Telegram
                      </a>
                      ，在个人介绍中公开了我的 GPG 公钥指纹。
                    </li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium">对于邮件地址：</p>
                  <ul className="ml-4 mt-2 space-y-1 text-gray-700 list-disc list-outside">
                    <li>
                      <a
                        href="mailto:Misaka13514@gmail.com"
                        className="text-blue-600 hover:underline"
                      >
                        Misaka13514@gmail.com
                      </a>
                      ，在 GitHub 上公开了该邮件地址。
                    </li>
                    <li>
                      <a
                        href="mailto:admin@atri.tk"
                        className="text-blue-600 hover:underline"
                      >
                        admin@atri.tk
                      </a>
                      ，可通过
                      <a
                        href="https://openpgpkey.atri.tk/.well-known/openpgpkey/atri.tk/hu/4y36rkzdjnzmk3oxaekyi5biowgr5kcz?l=admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        该域名的 Web Key Directory
                      </a>{" "}
                      验证。
                    </li>
                    <li>
                      <a
                        href="mailto:admin@apeiria.net"
                        className="text-blue-600 hover:underline"
                      >
                        admin@apeiria.net
                      </a>
                      ，可通过
                      <a
                        href="https://openpgpkey.apeiria.net/.well-known/openpgpkey/apeiria.net/hu/4y36rkzdjnzmk3oxaekyi5biowgr5kcz?l=admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        该域名的 Web Key Directory
                      </a>{" "}
                      验证。
                    </li>
                  </ul>
                </div>

                <p className="text-gray-600 mt-2">
                  对于邮件地址，亦接受 Challenge-Response 验证：使用我的 GPG
                  公钥加密一封邮件，并发送至您需要验证的邮箱地址。我会在收到邮件并解密后回复您，证明我拥有该邮箱地址的访问权限。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 在开始之前 */}
      <section id="before-start">
        <Card className="mb-4">
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">在开始之前</h2>
            <p className="font-medium mb-2">请确认：</p>
            <div className="space-y-4">
              <Controller
                name="hasGnuPG"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-5">
                      您已
                      <a
                        href="https://www.gnupg.org/download/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        安装 GnuPG
                      </a>
                      ，版本为 2.4.x 或更高。
                    </span>
                  </label>
                )}
              />

              <Controller
                name="hasPrivateKey"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-5">
                      您已拥有至少一个 GPG
                      私钥。确保您的私钥没有使用过期的算法或过期的密钥长度。如果您不确定，请
                      <a
                        href="https://wiki.archlinux.org/title/GnuPG#Create_a_key_pair"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        创建一个新的 GPG 密钥
                      </a>
                      。
                    </span>
                  </label>
                )}
              />

              <Controller
                name="understandsPublicConsequences"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-5">
                      您已了解将您的公钥上传至 Keyserver 后，您
                      <strong>在 GPG 密钥中使用的姓名和邮箱地址将被公开</strong>
                      ，对于部分 Keyserver，这些信息将
                      <strong>永远无法删除</strong>。
                    </span>
                  </label>
                )}
              />

              <Controller
                name="understandsNoRealName"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-5">
                      您已了解我在我的 GPG
                      密钥中不使用真名，因此我无法为您提供任何形式的实名验证。
                    </span>
                  </label>
                )}
              />

              <Controller
                name="understandsSigningImpact"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-0.5"
                    />
                    <div className="text-sm leading-5">
                      <span>
                        您已了解签署我的 GPG 密钥的影响，它包括但不限于：
                      </span>
                      <ul className="ml-4 mt-2 space-y-1 text-gray-700 list-disc list-outside">
                        <li>
                          您相信我拥有该密钥所对应的私钥，并愿意公开这样的信任关系。
                        </li>
                        <li>
                          您了解 GPG
                          信任网络的工作原理，公开这样的信任关系将会使得信任您的人也部分地信任我。
                        </li>
                        <li>
                          您了解信任网络的更新会潜在影响使用该网络的其它软件，例如这将会使
                          <a
                            href="https://github.com/Misaka13514-AUR/repo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            我的 Arch Linux 软件源
                          </a>
                          被在包管理器 pacman 中配置了信任您的用户所部分信任。
                        </li>
                      </ul>
                    </div>
                  </label>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 您的信息 */}
        <section id="your-info">
          <Card className="mb-4">
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">您的信息</h2>

              <div className="mb-4">
                <label className="block mb-2">
                  您的 GPG 私钥指纹 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="localUser"
                  control={control}
                  rules={{
                    required: "请输入您的 GPG 私钥指纹",
                    pattern: {
                      value: /^[0-9A-Fa-f]{16}$/,
                      message: "指纹格式无效，应为16位十六进制字符",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        {...field}
                        placeholder="1145141919810AAA"
                        className={`font-mono ${
                          fieldState.error ? "border-red-500" : ""
                        }`}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
                <small className="block mt-1 text-gray-500">
                  如果不确定，请运行{" "}
                  <code>
                    {'gpg --list-secret-keys --keyid-format long | grep "^sec"'}
                  </code>
                </small>
              </div>

              <div className="mb-4">
                <label className="block mb-2">
                  请选择要为我签名的 UID <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="uids"
                  control={control}
                  rules={{
                    required: "请至少选择一个 UID",
                    validate: (value) =>
                      value.length > 0 || "请至少选择一个 UID",
                  }}
                  render={({ field, fieldState }) => (
                    <div>
                      <div className="space-y-2">
                        {UID_OPTIONS.map((uid) => (
                          <label
                            key={uid}
                            className="flex items-start space-x-3 cursor-pointer"
                          >
                            <Checkbox
                              checked={field.value.includes(uid)}
                              onCheckedChange={(checked) => {
                                const newVal = checked
                                  ? [...field.value, uid]
                                  : field.value.filter((v) => v !== uid);
                                field.onChange(newVal);
                              }}
                              className="mt-0.5"
                            />
                            <span className="text-sm font-mono leading-5">
                              {uid}
                            </span>
                          </label>
                        ))}
                      </div>
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2">
                  您有多仔细地检查过我的密钥确实属于具有我的 UID 所描述的人呢？{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="certLevel"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-1"
                    >
                      {CERT_OPTIONS.map((opt) => (
                        <div
                          key={opt.value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem value={opt.value} id={opt.value} />
                          <label
                            htmlFor={opt.value}
                            className="text-sm cursor-pointer"
                          >
                            {opt.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2">
                  命令模式 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="commandMode"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <label
                          htmlFor="manual"
                          className="text-sm cursor-pointer"
                        >
                          <strong>手动输入模式</strong>
                          ：需要您在签署过程中手动输入信任信息
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="auto" id="auto" />
                        <label
                          htmlFor="auto"
                          className="text-sm cursor-pointer"
                        >
                          <strong>自动输入模式（实验性）</strong>
                          ：为您自动输入所选择的信任信息
                        </label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2">
                  输出模式 <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="outputMode"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="export" id="export" />
                        <label
                          htmlFor="export"
                          className="text-sm cursor-pointer"
                        >
                          <strong>导出签名文件</strong>
                          ：生成签名文件供您发送给我
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="upload" id="upload" />
                        <label
                          htmlFor="upload"
                          className="text-sm cursor-pointer"
                        >
                          <strong>直接上传到公钥服务器</strong>：立即公开该签名
                        </label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </section>
        <Button type="submit" className="w-full" disabled={!formComplete}>
          生成命令
        </Button>

        {!formComplete && (
          <p className="text-center text-sm text-gray-500 mt-2">
            {!checklistComplete
              ? "请完成上方所有检查项后再继续"
              : "请填写您的 GPG 私钥指纹并选择 UID"}
          </p>
        )}
      </form>
      {/* 命令模板 */}
      {commands.length > 0 && (
        <div className="mt-6 space-y-4" ref={commandsRef}>
          <h2 className="text-xl font-semibold mb-4">命令模板</h2>
          {commands.map((step, i) => (
            <CommandStepCard key={i} step={step} />
          ))}
        </div>
      )}

      {/* GitHub 链接 */}
      <section className="text-center mt-8">
        <a
          href="https://github.com/Misaka13514/gpg-signing-party"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:underline"
        >
          <Github className="mr-1 h-4 w-4" />
          在 GitHub 上查看项目
        </a>
      </section>
    </div>
  );
}
