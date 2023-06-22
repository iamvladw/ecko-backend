import {
    Entity,
    ObjectIdColumn,
    ObjectId,
    Column,
    PrimaryGeneratedColumn
} from 'typeorm';

@Entity({ name: 'badges' })
export class MySQLBadge {
    @PrimaryGeneratedColumn()
        id: number;

    @Column()
        uuid: string;

    @Column()
        icon: string;

    @Column()
        name: string;

    @Column()
        description: string;
}

@Entity({ name: 'badges' })
export class MongoDBBadge {
    @ObjectIdColumn()
        _id: ObjectId;

    @Column()
        uuid: string;

    @Column()
        icon: string;

    @Column()
        name: string;

    @Column()
        description: string;
}
