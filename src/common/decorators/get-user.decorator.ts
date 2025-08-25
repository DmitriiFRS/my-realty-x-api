import { createParamDecorator, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

export const GetUser = createParamDecorator(
  // data — это то, что передали в скобках @GetUser('id')
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // payload после успешного JWT-guard
    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.UNAUTHORIZED);
    }
    return data ? user[data] : user; // если data = 'id', вернётся user.id
  },
);
